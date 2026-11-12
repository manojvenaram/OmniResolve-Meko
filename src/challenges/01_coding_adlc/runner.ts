import { MekoClient } from '../../meko/client.ts';
import { CODING_STANDARDS_DOCS } from './standards.ts';
import { CursorAgent, ClaudeCodeAgent, PRReviewAgent } from './agents.ts';

export async function runCodingChallengeDemo() {
  console.log('================================================================');
  console.log(' CHALLENGE 1: ONE MEMORY, EVERY CODING AGENT');
  console.log(' Codifying Team Standards Across Cursor, Claude Code & CI');
  console.log('================================================================\n');

  const mekoClient = new MekoClient({ datapackId: 'adlc-engineering-datapack' });
  await mekoClient.batchIngestKnowledgeDocs(CODING_STANDARDS_DOCS);

  const cursorAgent = new CursorAgent(mekoClient);
  const claudeAgent = new ClaudeCodeAgent(mekoClient);
  const prReviewer = new PRReviewAgent(mekoClient);

  // 1. Cursor IDE Agent learns/codifies ADR-002
  console.log('[Step 1] Cursor IDE Agent codifies ADR-002 into Meko Datapack...');
  const adrMemory = await cursorAgent.codifyArchitectureDecision({
    adrId: 'ADR-002',
    title: 'Unit-of-Work & Repository Pattern',
    rule: 'Direct SQL or raw ORM calls in HTTP route controllers are strictly forbidden. All data access must pass through Repository interfaces governed by Unit-of-Work.',
    tags: ['repository', 'unit_of_work', 'sql', 'database']
  });
  console.log(`  [+] Memory created: ${adrMemory.id} ("${adrMemory.title}")\n`);

  // 2. Before Meko: Terminal agent without shared memory
  console.log('[Step 2] Baseline Run: Claude Code generates code WITHOUT Meko Context...');
  const naiveProposal = await claudeAgent.implementFeature('payment_processing', false);
  const naiveReview = await prReviewer.reviewPullRequest(naiveProposal);
  console.log(`  [-] PR Status: ${naiveReview.approved ? 'APPROVED' : 'REJECTED'}`);
  console.log(`  [-] Violations Found: ${naiveReview.violationsFound.length}`);
  naiveReview.violationsFound.forEach(v => console.log(`      * ${v}`));
  console.log();

  // 3. After Meko: Terminal agent connects to shared Meko Datapack
  console.log('[Step 3] Meko Run: Claude Code generates code WITH Meko Context...');
  const mekoProposal = await claudeAgent.implementFeature('payment_processing', true);
  const mekoReview = await prReviewer.reviewPullRequest(mekoProposal);
  console.log(`  [+] PR Status: ${mekoReview.approved ? 'APPROVED' : 'REJECTED'}`);
  console.log(`  [+] Violations Found: ${mekoReview.violationsFound.length}`);
  console.log(`  [+] Conforming Code Generated and Merged into main!\n`);

  return {
    adrMemory,
    baseline: { proposal: naiveProposal, review: naiveReview },
    withMeko: { proposal: mekoProposal, review: mekoReview }
  };
}

if (import.meta.main) {
  runCodingChallengeDemo().catch(console.error);
}
