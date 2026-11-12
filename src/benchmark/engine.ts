import { SupportTicket, TicketRunMetrics, BenchmarkSummary, AgentResolution } from '../types.ts';
import { MekoClient } from '../meko/client.ts';
import { TriageAgent } from '../agents/triage_agent.ts';
import { SpecialistAgent } from '../agents/specialist_agent.ts';
import { HitlPromoter } from '../agents/hitl_promoter.ts';
import { ENTERPRISE_KNOWLEDGE_BASE } from '../knowledge/index.ts';

export class BenchmarkEngine {
  public static async runBenchmark(tickets: SupportTicket[]): Promise<{
    metrics: TicketRunMetrics[];
    summary: BenchmarkSummary;
    mekoResolutions: AgentResolution[];
    baselineResolutions: AgentResolution[];
  }> {
    const metrics: TicketRunMetrics[] = [];
    const mekoResolutions: AgentResolution[] = [];
    const baselineResolutions: AgentResolution[] = [];

    // ========================================================
    // 1. RUN BASELINE (No Shared Memory - Every ticket from scratch)
    // ========================================================
    console.log('>>> [1/2] Executing Baseline Benchmark (No Shared Memory)...');
    for (const ticket of tickets) {
      // In baseline, each ticket starts with an empty/isolated client
      const baselineClient = new MekoClient({ datapackId: 'baseline-isolated-nop' });
      await baselineClient.batchIngestKnowledgeDocs(ENTERPRISE_KNOWLEDGE_BASE);

      const triage = new TriageAgent(baselineClient);
      const specialist = new SpecialistAgent(baselineClient);

      // Baseline triage will always miss memory
      const triageRes = await triage.evaluateTicket(ticket);
      const resolution = await specialist.diagnoseAndSolve(ticket, triageRes.searchTrace);

      baselineResolutions.push(resolution);
    }

    // ========================================================
    // 2. RUN MEKO OMNIRESOLVE (Shared Collective Memory Enabled)
    // ========================================================
    console.log('>>> [2/2] Executing OmniResolve Benchmark (With Meko Collective Memory)...');
    const mekoClient = new MekoClient({ datapackId: 'omni-resolve-shared-datapack' });
    await mekoClient.batchIngestKnowledgeDocs(ENTERPRISE_KNOWLEDGE_BASE);

    const triage = new TriageAgent(mekoClient);
    const specialist = new SpecialistAgent(mekoClient);
    const hitl = new HitlPromoter(mekoClient);

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const baseline = baselineResolutions[i];

      // Evaluate ticket with Meko shared memory
      const triageRes = await triage.evaluateTicket(ticket);
      let mekoRes: AgentResolution;

      if (triageRes.hit && triageRes.resolution) {
        // High-speed resolution via collective memory
        mekoRes = triageRes.resolution;
      } else {
        // Novel issue: Specialist solves and HITL promotes to Meko memory
        mekoRes = await specialist.diagnoseAndSolve(ticket, triageRes.searchTrace);
        await hitl.reviewAndPromote(ticket, mekoRes, true);
      }

      mekoResolutions.push(mekoRes);

      // Calculate deltas
      const tokenSavings = Math.max(0, baseline.totalTokens - mekoRes.totalTokens);
      const tokenSavingsPercent = Number(((tokenSavings / baseline.totalTokens) * 100).toFixed(1));

      const latencySavings = Math.max(0, baseline.totalLatencyMs - mekoRes.totalLatencyMs);
      const latencyImprovementPercent = Number(((latencySavings / Math.max(1, baseline.totalLatencyMs)) * 100).toFixed(1));

      metrics.push({
        ticketId: ticket.id,
        clusterId: ticket.clusterId,
        isRepeat: ticket.isRepeat,
        baselineTokens: baseline.totalTokens,
        baselineLatencyMs: baseline.totalLatencyMs,
        baselineSteps: baseline.toolStepsCount,
        mekoTokens: mekoRes.totalTokens,
        mekoLatencyMs: mekoRes.totalLatencyMs,
        mekoSteps: mekoRes.toolStepsCount,
        tokenSavingsPercent,
        latencyImprovementPercent,
        memoryHit: mekoRes.isMemoryHit
      });
    }

    // ========================================================
    // 3. STATISTICAL AGGREGATION
    // ========================================================
    const repeatMetrics = metrics.filter(m => m.isRepeat);
    const novelMetrics = metrics.filter(m => !m.isRepeat);

    const baselineAvgTokensRepeat = Math.round(
      repeatMetrics.reduce((acc, m) => acc + m.baselineTokens, 0) / repeatMetrics.length
    );
    const mekoAvgTokensRepeat = Math.round(
      repeatMetrics.reduce((acc, m) => acc + m.mekoTokens, 0) / repeatMetrics.length
    );
    const repeatTokenSavingsPercent = Number(
      (((baselineAvgTokensRepeat - mekoAvgTokensRepeat) / baselineAvgTokensRepeat) * 100).toFixed(1)
    );

    const baselineAvgLatencyRepeatMs = Math.round(
      repeatMetrics.reduce((acc, m) => acc + m.baselineLatencyMs, 0) / repeatMetrics.length
    );
    const mekoAvgLatencyRepeatMs = Math.round(
      repeatMetrics.reduce((acc, m) => acc + m.mekoLatencyMs, 0) / repeatMetrics.length
    );
    const repeatLatencyImprovementPercent = Number(
      (((baselineAvgLatencyRepeatMs - mekoAvgLatencyRepeatMs) / Math.max(1, baselineAvgLatencyRepeatMs)) * 100).toFixed(1)
    );

    const baselineAvgStepsRepeat = Number(
      (repeatMetrics.reduce((acc, m) => acc + m.baselineSteps, 0) / repeatMetrics.length).toFixed(1)
    );
    const mekoAvgStepsRepeat = Number(
      (repeatMetrics.reduce((acc, m) => acc + m.mekoSteps, 0) / repeatMetrics.length).toFixed(1)
    );

    const memoryHitsCount = repeatMetrics.filter(m => m.memoryHit).length;
    const memoryHitRatePercent = Number(((memoryHitsCount / repeatMetrics.length) * 100).toFixed(1));

    const totalBaselineTokens = metrics.reduce((acc, m) => acc + m.baselineTokens, 0);
    const totalMekoTokens = metrics.reduce((acc, m) => acc + m.mekoTokens, 0);
    const overallTokenReductionFactor = Number((totalBaselineTokens / totalMekoTokens).toFixed(2));

    const summary: BenchmarkSummary = {
      totalTickets: tickets.length,
      novelTicketsCount: novelMetrics.length,
      repeatTicketsCount: repeatMetrics.length,
      baselineAvgTokensRepeat,
      mekoAvgTokensRepeat,
      repeatTokenSavingsPercent,
      baselineAvgLatencyRepeatMs,
      mekoAvgLatencyRepeatMs,
      repeatLatencyImprovementPercent,
      baselineAvgStepsRepeat,
      mekoAvgStepsRepeat,
      memoryHitRatePercent,
      overallTokenReductionFactor
    };

    return { metrics, summary, mekoResolutions, baselineResolutions };
  }
}

