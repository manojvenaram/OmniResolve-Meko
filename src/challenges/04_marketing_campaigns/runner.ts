import { CUSTOMER_SEGMENTS, BRAND_KIT_DOCS } from './brand_and_data.ts';
import { MarketingAgentTeam } from './agents.ts';
import { MekoClient } from '../../meko/client.ts';

export async function runMarketingChallenge() {
  console.log('================================================================');
  console.log(' CHALLENGE 4: CAMPAIGNS THAT KNOW THE CUSTOMER');
  console.log(' Multi-Agent Marketing Team with Cross-Cycle Meko Learnings');
  console.log('================================================================\n');

  const team = new MarketingAgentTeam();

  // 1. Run Campaign Cycle 1 (Baseline before Meko memory learnings)
  console.log('[Cycle 1] Executing Cycle 1 across 3 Customer Segments...');
  const cycle1 = await team.produceCampaignCycle(1, CUSTOMER_SEGMENTS);
  const avgCtr1 = cycle1.assets.reduce((a, b) => a + b.projectedCtr, 0) / cycle1.assets.length;
  console.log(`  [+] Cycle 1 Average CTR: ${avgCtr1.toFixed(1)}%`);
  cycle1.assets.forEach(a => {
    console.log(`      * [${a.segmentId}] "${a.headline}" (${a.recommendedChannel})`);
  });
  console.log();

  // 2. Campaign Analyst stores verified findings into Meko Collective Memory
  console.log('[Learning Loop] Campaign Analyst writes Cycle 1 performance into Meko Learnings Datapack...');
  await team.recordCycle1Learnings();
  console.log('  [+] Durable learning recorded: "Engineering buyers respond to concrete pain (-80% tokens) over fluff"\n');

  // 3. Run Campaign Cycle 2 (Leveraging Meko Collective Memory)
  console.log('[Cycle 2] Executing Cycle 2 with Meko Shared Memory Enabled...');
  const cycle2 = await team.produceCampaignCycle(2, CUSTOMER_SEGMENTS);
  const avgCtr2 = cycle2.assets.reduce((a, b) => a + b.projectedCtr, 0) / cycle2.assets.length;
  console.log(`  [+] Cycle 2 Average CTR: ${avgCtr2.toFixed(1)}% (+${(((avgCtr2 - avgCtr1) / avgCtr1) * 100).toFixed(0)}% Lift!)`);
  cycle2.assets.forEach(a => {
    console.log(`      * [${a.segmentId}] "${a.headline}" (${a.recommendedChannel})`);
    console.log(`        -> Copy: "${a.bodyCopy.substring(0, 95)}..."`);
  });
  console.log();

  return {
    cycle1: { assets: cycle1.assets, avgCtr: avgCtr1 },
    cycle2: { assets: cycle2.assets, avgCtr: avgCtr2 },
    traces: cycle2.traces
  };
}

if (import.meta.main) {
  runMarketingChallenge().catch(console.error);
}
