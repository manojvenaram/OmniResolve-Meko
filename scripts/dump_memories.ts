import { MekoClient } from '../src/meko/client.ts';
import { runCodingChallengeDemo } from '../src/challenges/01_coding_adlc/runner.ts';
import { BenchmarkEngine } from '../src/benchmark/engine.ts';
import { SYNTHETIC_TICKETS } from '../src/data/tickets.ts';
import { runFraudDetectionChallenge } from '../src/challenges/03_fraud_detection/runner.ts';
import { runMarketingChallenge } from '../src/challenges/04_marketing_campaigns/runner.ts';
import { runFinancialPlannerChallenge } from '../src/challenges/05_financial_planner/runner.ts';
import { runHealthcareChallenge } from '../src/challenges/06_governed_healthcare/runner.ts';
import { runAuditTracesChallenge } from '../src/challenges/07_audit_traces/runner.ts';
import { runTokenEfficiencyBenchmark } from '../src/challenges/08_token_efficiency/runner.ts';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  console.log('[*] Harvesting all durable memories across 8 Meko Datapacks...');

  // Execute all pipelines to populate memories
  await runCodingChallengeDemo();
  await BenchmarkEngine.runBenchmark(SYNTHETIC_TICKETS);
  await runFraudDetectionChallenge();
  await runMarketingChallenge();
  await runFinancialPlannerChallenge();
  await runHealthcareChallenge();
  await runAuditTracesChallenge();
  await runTokenEfficiencyBenchmark();

  // Export all memories from all datapacks
  const allDatapacks = [
    'adlc-engineering-datapack',
    'omni-resolve-shared-datapack',
    'fraud-raw-signals',
    'fraud-confirmed-threats',
    'marketing-brand-assets',
    'marketing-campaign-learnings',
    'financial-planning-household',
    'healthcare-clinical-datapack',
    'healthcare-pharmacy-datapack',
    'healthcare-billing-datapack',
    'audit-underwriting-decisions',
    'research-token-efficiency'
  ];

  const memoryDump: Record<string, any[]> = {};
  let totalMemories = 0;

  for (const dpId of allDatapacks) {
    const client = new MekoClient({ datapackId: dpId, currentRole: 'clinical' });
    const memories = await client.listAllMemories();
    if (memories.length > 0) {
      memoryDump[dpId] = memories;
      totalMemories += memories.length;
    }
  }

  const outDir = join(process.cwd(), 'src', 'data');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, 'persisted_memories.json');
  writeFileSync(outPath, JSON.stringify(memoryDump, null, 2));

  console.log(`\n[+] Successfully saved ${totalMemories} durable memories across ${Object.keys(memoryDump).length} datapacks!`);
  console.log(`[+] Exported to: ${outPath}`);
}

main().catch(console.error);
