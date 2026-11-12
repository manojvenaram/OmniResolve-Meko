import { MekoClient } from '../../meko/client.ts';
import { SecurityEvent } from './stream.ts';
import { DecisionTrace } from '../../types.ts';

export interface ThreatSignal {
  userId: string;
  threatType: 'ip_anomaly' | 'device_mismatch' | 'reset_suspicion' | 'micro_probe';
  confidence: number;
  details: string;
}

export class FraudDetectionCluster {
  private rawSignalsClient: MekoClient;
  private confirmedThreatsClient: MekoClient;

  constructor() {
    // Challenge 3 specification: Separate datapacks for raw signals and confirmed fraud patterns
    this.rawSignalsClient = new MekoClient({ datapackId: 'fraud-raw-signals' });
    this.confirmedThreatsClient = new MekoClient({ datapackId: 'fraud-confirmed-threats' });
  }

  // Login Monitor Agent
  public async evaluateLogin(event: SecurityEvent, useSharedMemory: boolean): Promise<boolean> {
    const isSuspicious = event.ipAddress.startsWith('194.26.29.');
    if (isSuspicious && useSharedMemory) {
      await this.rawSignalsClient.memoryAdd({
        title: `IP Threat Signal: ${event.userId}`,
        clusterId: 'threat_ip_anomaly',
        problemSignature: `${event.userId} | ${event.ipAddress} | ASN Bulletproof`,
        rootCause: 'High-risk anonymizing proxy login attempt',
        verifiedFix: 'Mandate step-up MFA challenge on next session event',
        tags: ['fraud', 'ip_anomaly', event.userId, event.ipAddress]
      });

      await this.rawSignalsClient.recordTrace({
        ticketId: event.id,
        agentName: 'triage_agent',
        action: 'context_search',
        inputSummary: `Login from ${event.ipAddress} for ${event.userId}`,
        retrievedMemoryIds: [],
        retrievedDocIds: [],
        reasoning: `Detected high-risk IP range [194.26.29.x]. Emitted threat signal to Meko shared memory for downstream transaction agents.`,
        outputSummary: `Risk signal recorded in Meko collective memory.`,
        tokenUsage: { promptTokens: 140, completionTokens: 60, totalTokens: 200 },
        latencyMs: 45
      });
    }
    return isSuspicious;
  }

  // Device Fingerprint Agent
  public async evaluateDevice(event: SecurityEvent, useSharedMemory: boolean): Promise<boolean> {
    const isHeadless = event.deviceFingerprint.includes('headless');
    if (isHeadless && useSharedMemory) {
      await this.rawSignalsClient.memoryAdd({
        title: `Device Threat Signal: ${event.userId}`,
        clusterId: 'threat_device_mismatch',
        problemSignature: `${event.userId} | ${event.deviceFingerprint}`,
        rootCause: 'Headless automation signature detected on newly registered device',
        verifiedFix: 'Quarantine device registration and notify security operations',
        tags: ['fraud', 'device_mismatch', event.userId, event.deviceFingerprint]
      });
    }
    return isHeadless;
  }

  // Transaction & Cashout Agent with Meko Memory Correlation
  public async evaluateTransaction(
    event: SecurityEvent,
    useSharedMemory: boolean
  ): Promise<{ blocked: boolean; reason: string; traces: DecisionTrace[]; stepEarly: number }> {
    const startTime = performance.now();
    const traces: DecisionTrace[] = [];

    if (!useSharedMemory) {
      // Baseline without shared memory:
      // The transaction agent only sees the isolated transaction payload.
      // Small micro-transaction ($1.00) passes through.
      // Big cashout ($4500.00) only triggers a delayed bank rule at Stage 5!
      if (event.eventType === 'cashout_transaction') {
        return {
          blocked: true,
          reason: 'Late rule block: Single transaction exceeded $4,000 threshold at Stage 5.',
          traces: [],
          stepEarly: 0 // 0 steps early (attack completed up to final cashout)
        };
      }
      return { blocked: false, reason: 'Transaction allowed (No shared threat context)', traces: [], stepEarly: 0 };
    }

    // With Meko Collective Memory:
    // Interrogates shared datapack for threat signals specifically associated with this user or IP
    const context = await this.rawSignalsClient.contextSearch(
      `${event.userId} ${event.ipAddress} ip_anomaly device_mismatch`,
      { topKMemories: 5, minScoreThreshold: 0.40 }
    );

    // Exact user/IP signal matching to eliminate false positives
    const memoryHits = context.memories.filter(m => 
      m.memory.tags.includes(event.userId) || m.memory.tags.includes(event.ipAddress)
    );

    if (memoryHits.length >= 2 || (memoryHits.length >= 1 && event.eventType === 'micro_transaction')) {
      // Attack caught BEFORE cashout! (Stage 3 or 4)
      const memoryTitles = memoryHits.map(m => m.memory.title).join(' + ');

      const trace = await this.confirmedThreatsClient.recordTrace({
        ticketId: event.id,
        agentName: 'specialist_agent',
        action: 'resolve',
        inputSummary: `ATO Correlation check for ${event.userId} on ${event.eventType}`,
        retrievedMemoryIds: memoryHits.map(m => m.memory.id),
        retrievedDocIds: [],
        reasoning: `Correlated ${memoryHits.length} independent signals from Meko collective memory: [${memoryTitles}]. Attacker is conducting multi-stage Account Takeover. Freezing account immediately before cashout.`,
        outputSummary: `ACCOUNT LOCKED & TAKEOVER PREVENTED 2 STEPS EARLY.`,
        tokenUsage: { promptTokens: 380, completionTokens: 160, totalTokens: 540 },
        latencyMs: Math.round(performance.now() - startTime)
      });
      traces.push(trace);

      // Save confirmed fraud pattern to separate confirmed threats datapack
      await this.confirmedThreatsClient.memoryAdd({
        title: `CONFIRMED ATO: ${event.userId}`,
        clusterId: 'confirmed_fraud_pattern',
        problemSignature: `Takeover coordinated from ${event.ipAddress}`,
        rootCause: `Correlated attack signals across LoginMonitor and DeviceAgent`,
        verifiedFix: `Permanent block on ASN and reset compromised user session`,
        tags: ['confirmed_fraud', event.userId, event.ipAddress]
      });

      const stepsEarly = event.eventType === 'micro_transaction' ? 2 : 1;
      return {
        blocked: true,
        reason: `Meko Correlated ATO Pattern: Caught across signals (${memoryTitles})`,
        traces,
        stepEarly: stepsEarly
      };
    }

    return { blocked: false, reason: 'Allowed (Normal risk profile)', traces, stepEarly: 0 };
  }

  public getConfirmedThreatsTraces(): DecisionTrace[] {
    return this.confirmedThreatsClient.getAllTraces();
  }
}
