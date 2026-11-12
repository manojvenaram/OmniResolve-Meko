import { describe, test, expect } from 'bun:test';
import { runCodingChallengeDemo } from '../src/challenges/01_coding_adlc/runner.ts';
import { BenchmarkEngine } from '../src/benchmark/engine.ts';
import { SYNTHETIC_TICKETS } from '../src/data/tickets.ts';
import { runFraudDetectionChallenge } from '../src/challenges/03_fraud_detection/runner.ts';
import { runMarketingChallenge } from '../src/challenges/04_marketing_campaigns/runner.ts';
import { runFinancialPlannerChallenge } from '../src/challenges/05_financial_planner/runner.ts';
import { runHealthcareChallenge } from '../src/challenges/06_governed_healthcare/runner.ts';
import { runAuditTracesChallenge } from '../src/challenges/07_audit_traces/runner.ts';
import { runTokenEfficiencyBenchmark } from '../src/challenges/08_token_efficiency/runner.ts';

describe('ContextCon 2026: The Meko Omniverse (All 8 Challenges)', () => {
  test('Challenge 1: One Memory, Every Coding Agent (Cursor + Claude + CI)', async () => {
    const res = await runCodingChallengeDemo();
    expect(res.adrMemory).toBeDefined();
    expect(res.baseline.review.approved).toBe(false);
    expect(res.baseline.review.violationsFound.length).toBeGreaterThan(0);
    expect(res.withMeko.review.approved).toBe(true);
    expect(res.withMeko.review.violationsFound.length).toBe(0);
  });

  test('Challenge 2: Never Solve It Twice (Agentic Support Benchmarks)', async () => {
    const { summary } = await BenchmarkEngine.runBenchmark(SYNTHETIC_TICKETS);
    expect(summary.totalTickets).toBe(35);
    expect(summary.repeatTokenSavingsPercent).toBeGreaterThan(70);
    expect(summary.memoryHitRatePercent).toBeGreaterThan(90);
  });

  test('Challenge 3: Remember the Attacker (Agentic Fraud Detection across 2,000 events)', async () => {
    const res = await runFraudDetectionChallenge();
    expect(res.totalEvents).toBe(2000);
    expect(res.attacksPreventedEarly).toBe(6);
    expect(res.falsePositives).toBe(0);
    expect(res.sampleTraces.length).toBe(3);
  });

  test('Challenge 4: Campaigns That Know the Customer (Cross-Cycle Marketing Memory)', async () => {
    const res = await runMarketingChallenge();
    expect(res.cycle1.assets.length).toBe(3);
    expect(res.cycle2.assets.length).toBe(3);
    expect(res.cycle2.avgCtr).toBeGreaterThan(res.cycle1.avgCtr);
  });

  test('Challenge 5: The Planner That Remembers (Multi-Session Financial Advisory)', async () => {
    const res = await runFinancialPlannerChallenge();
    expect(res.sessions.length).toBe(3);
    expect(res.sessions[1].education529Allocated).toBe(400); // Baby plan adapted
    expect(res.whatIf.viable).toBe(true);
  });

  test('Challenge 6: Patient Context, Governed (Healthcare RBAC Datapacks)', async () => {
    const res = await runHealthcareChallenge();
    expect(res.medicationCheck.conflictDetected).toBe(true); // Amoxicillin vs Penicillin
    expect(res.governanceTest.billingCanSeeClinicalNotes).toBe(false); // Strict isolation
    expect(res.governanceTest.billingCanSeeBillingDocs).toBe(true);
  });

  test('Challenge 7: Show Your Work (10 Decision Traces & Deterministic Replay)', async () => {
    const res = await runAuditTracesChallenge();
    expect(res.totalDecisions).toBe(10);
    expect(res.decisions[0].plainEnglishAuditCard).toContain('2-MINUTE AUDIT EXPLANATION CARD');
    expect(res.replayTest?.verifiedMatch).toBe(true);
  });

  test('Challenge 8: Do More with Fewer Tokens (15x Token Reduction Benchmark)', async () => {
    const res = await runTokenEfficiencyBenchmark();
    expect(res.results.length).toBe(10);
    expect(res.avgReductionFactor).toBeGreaterThanOrEqual(13.0);
    expect(res.avgQuality).toBeGreaterThan(90);
  });
});

