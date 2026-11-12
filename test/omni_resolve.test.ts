import { describe, test, expect, beforeEach } from 'bun:test';
import { MekoClient } from '../src/meko/client.ts';
import { TriageAgent } from '../src/agents/triage_agent.ts';
import { SpecialistAgent } from '../src/agents/specialist_agent.ts';
import { HitlPromoter } from '../src/agents/hitl_promoter.ts';
import { ENTERPRISE_KNOWLEDGE_BASE } from '../src/knowledge/index.ts';
import { SYNTHETIC_TICKETS } from '../src/data/tickets.ts';

describe('OmniResolve - Multi-Agent Support with Meko Context Engine', () => {
  let mekoClient: MekoClient;
  let triageAgent: TriageAgent;
  let specialistAgent: SpecialistAgent;
  let hitlPromoter: HitlPromoter;

  beforeEach(async () => {
    MekoClient.resetAllDatapacks();
    mekoClient = new MekoClient({ datapackId: 'test-support-datapack' });
    await mekoClient.batchIngestKnowledgeDocs(ENTERPRISE_KNOWLEDGE_BASE);
    triageAgent = new TriageAgent(mekoClient);
    specialistAgent = new SpecialistAgent(mekoClient);
    hitlPromoter = new HitlPromoter(mekoClient, 'test_reviewer');
  });

  test('Meko Client stores memories and records decision traces', async () => {
    const memory = await mekoClient.memoryAdd({
      title: 'OAuth Refresh Token Lock Pattern',
      clusterId: 'cluster_oauth_refresh',
      problemSignature: 'concurrent 401 token_revoked',
      rootCause: 'RTR race condition',
      verifiedFix: 'In-flight promise lock',
      tags: ['authentication', 'oauth', 'token']
    });

    expect(memory.id).toBeDefined();
    expect(memory.title).toContain('OAuth');

    const trace = await mekoClient.recordTrace({
      ticketId: 'test_tkt_01',
      agentName: 'triage_agent',
      action: 'context_search',
      inputSummary: 'Test search query',
      retrievedMemoryIds: [memory.id],
      retrievedDocIds: [],
      reasoning: 'Testing trace recording',
      outputSummary: 'Test trace output',
      tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      latencyMs: 12
    });

    expect(trace.id).toBeDefined();
    const ticketTraces = mekoClient.getTracesForTicket('test_tkt_01');
    expect(ticketTraces.length).toBe(1);
    expect(ticketTraces[0].tokenUsage.totalTokens).toBe(150);
  });

  test('First-time novel ticket escalates to Specialist and promotes to Meko Memory', async () => {
    const novelTicket = SYNTHETIC_TICKETS[0]; // tkt_oauth_01

    // Step 1: Triage should miss because memory is empty
    const triageResult = await triageAgent.evaluateTicket(novelTicket);
    expect(triageResult.hit).toBe(false);
    expect(triageResult.searchTrace.agentName).toBe('triage_agent');

    // Step 2: Specialist diagnoses and solves
    const specialistResult = await specialistAgent.diagnoseAndSolve(novelTicket, triageResult.searchTrace);
    expect(specialistResult.resolvedBy).toBe('specialist_agent');
    expect(specialistResult.isMemoryHit).toBe(false);
    expect(specialistResult.rootCause).toContain('Refresh Token Rotation');
    expect(specialistResult.codePatch).toBeDefined();

    // Step 3: HITL promotes to Meko Datapack Memory
    const hitlResult = await hitlPromoter.reviewAndPromote(novelTicket, specialistResult, true);
    expect(hitlResult.approved).toBe(true);
    expect(hitlResult.memory).toBeDefined();

    const storedMemories = await mekoClient.listAllMemories();
    expect(storedMemories.length).toBe(1);
  });

  test('Repeat variant ticket reuses Meko Collective Memory in 1 step with >75% token reduction', async () => {
    const novelTicket = SYNTHETIC_TICKETS[0]; // tkt_oauth_01
    const repeatTicket = SYNTHETIC_TICKETS[1]; // tkt_oauth_02

    // Solve and promote novel issue
    const triage1 = await triageAgent.evaluateTicket(novelTicket);
    const spec1 = await specialistAgent.diagnoseAndSolve(novelTicket, triage1.searchTrace);
    await hitlPromoter.reviewAndPromote(novelTicket, spec1, true);

    // Now process repeat ticket
    const triage2 = await triageAgent.evaluateTicket(repeatTicket);
    expect(triage2.hit).toBe(true);
    expect(triage2.resolution).toBeDefined();

    const res = triage2.resolution!;
    expect(res.resolvedBy).toBe('triage_agent');
    expect(res.isMemoryHit).toBe(true);
    expect(res.toolStepsCount).toBe(1);
    expect(res.totalTokens).toBeLessThan(1000); // 860 tokens
    expect(spec1.totalTokens).toBeGreaterThan(4500); // ~5,100 tokens

    const tokenSavingsPercent = ((spec1.totalTokens - res.totalTokens) / spec1.totalTokens) * 100;
    expect(tokenSavingsPercent).toBeGreaterThan(75); // ~83% savings
  });
});

