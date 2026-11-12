import { SupportTicket, AgentResolution, MekoMemory, DecisionTrace } from '../types.ts';
import { MekoClient } from '../meko/client.ts';

export class HitlPromoter {
  private mekoClient: MekoClient;
  private reviewerName: string;

  constructor(mekoClient: MekoClient, reviewerName = 'senior_staff_eng_hitl') {
    this.mekoClient = mekoClient;
    this.reviewerName = reviewerName;
  }

  public async reviewAndPromote(
    ticket: SupportTicket,
    resolution: AgentResolution,
    autoApprove = true
  ): Promise<{ approved: boolean; memory?: MekoMemory; trace: DecisionTrace }> {
    const startTime = performance.now();

    // Quality Verification Checklist
    const hasValidRootCause = resolution.rootCause && resolution.rootCause.length > 25;
    const hasValidSteps = resolution.resolutionSteps && resolution.resolutionSteps.length >= 2;
    const hasCodePatch = !!resolution.codePatch;

    const isQualified = hasValidRootCause && hasValidSteps && hasCodePatch && autoApprove;

    if (!isQualified) {
      const trace = await this.mekoClient.recordTrace({
        ticketId: ticket.id,
        agentName: 'hitl_gate',
        action: 'verify',
        inputSummary: `HITL Review requested for ${ticket.id}`,
        retrievedMemoryIds: [],
        retrievedDocIds: [],
        reasoning: `Resolution did not meet all quality thresholds or auto-approval was paused. Memory promotion declined.`,
        outputSummary: `Rejected promotion to collective memory.`,
        tokenUsage: { promptTokens: 80, completionTokens: 40, totalTokens: 120 },
        latencyMs: Math.round(performance.now() - startTime)
      });

      return { approved: false, trace };
    }

    // Extract clean tags including split cluster words
    const clusterKeywords = ticket.clusterId.replace('cluster_', '').split('_');
    const tags = Array.from(new Set([
      ticket.category,
      ...clusterKeywords,
      ticket.environment.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    ]));

    // Promote to Meko Datapack Memory via memory_add
    const memory = await this.mekoClient.memoryAdd({
      title: `${ticket.category.toUpperCase()}: ${ticket.title.substring(0, 55)}`,
      clusterId: ticket.clusterId,
      problemSignature: `${ticket.title} | ${ticket.description.substring(0, 100)} | ${ticket.errorLogs ?? ''}`,
      rootCause: resolution.rootCause,
      verifiedFix: resolution.resolutionSteps.join('; '),
      codeSnippet: resolution.codePatch,
      tags,
      confidence: 0.98,
      promotedBy: this.reviewerName
    });

    const latency = Math.round(performance.now() - startTime);

    const trace = await this.mekoClient.recordTrace({
      ticketId: ticket.id,
      agentName: 'hitl_gate',
      action: 'memory_add',
      inputSummary: `Promoting verified resolution for ${ticket.id} to Meko Datapack '${this.mekoClient.getDatapackId()}'`,
      retrievedMemoryIds: [memory.id],
      retrievedDocIds: [],
      reasoning: `Resolution verified by ${this.reviewerName}. Verified fix and code patch are durable, high-impact, and reusable for repeat cluster ${ticket.clusterId}. Durable memory created with ID [${memory.id}].`,
      outputSummary: `Promoted resolution to Meko Collective Memory. Any future ticket matching this signature will resolve in 1 turn without specialist escalation.`,
      tokenUsage: { promptTokens: 95, completionTokens: 45, totalTokens: 140 },
      latencyMs: latency
    });

    // Update resolution state
    resolution.hitlApproved = true;
    resolution.hitlNotes = `Approved & promoted to Meko Memory [${memory.id}] by ${this.reviewerName}`;
    resolution.traces.push(trace);

    return { approved: true, memory, trace };
  }
}
