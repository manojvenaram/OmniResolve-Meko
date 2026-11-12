import { INITIAL_HOUSEHOLD_STATE } from './profile.ts';
import { CollaborativeFinancialPlanner } from './agents.ts';

export async function runFinancialPlannerChallenge() {
  console.log('================================================================');
  console.log(' CHALLENGE 5: THE PLANNER THAT REMEMBERS');
  console.log(' Multi-Session Financial Advisory Adapting to Major Life Events');
  console.log('================================================================\n');

  const planner = new CollaborativeFinancialPlanner();

  // Session 1: Baseline
  console.log('[Session 1: Initial Consultation (Jan 2026)]');
  const s1 = await planner.runSession1InitialPlan(INITIAL_HOUSEHOLD_STATE);
  console.log(`  [+] Strategy: Debt = $${s1.debtPaymentAllocated}/mo | Savings = $${s1.monthlySavingsAllocated}/mo | 529 = $${s1.education529Allocated}/mo`);
  console.log(`  [+] Reasoning: ${s1.reasoningTraces[0]}\n`);

  // Session 2: Life Event - Baby
  console.log('[Session 2: Life Event - Baby Born (June 2026)]');
  const s2 = await planner.runSession2BabyLifeEvent();
  console.log(`  [+] Strategy: Debt = $${s2.debtPaymentAllocated}/mo | Savings = $${s2.monthlySavingsAllocated}/mo | 529 = $${s2.education529Allocated}/mo`);
  console.log(`  [+] Reasoning: ${s2.reasoningTraces[0]}\n`);

  // Session 3: Life Event - Career Promotion
  console.log('[Session 3: Life Event - Career Promotion (Nov 2026)]');
  const s3 = await planner.runSession3PromotionLifeEvent();
  console.log(`  [+] Strategy: Debt = $${s3.debtPaymentAllocated}/mo | Savings = $${s3.monthlySavingsAllocated}/mo | 529 = $${s3.education529Allocated}/mo`);
  console.log(`  [+] Reasoning: ${s3.reasoningTraces[0]}\n`);

  // What-If Scenario
  console.log('[What-If Scenario Simulation]');
  const whatIf = planner.runWhatIfScenario('sabbatical_6mo');
  console.log(`  [?] Scenario: "${whatIf.scenario}"`);
  console.log(`  [=] Impact:   ${whatIf.impactSummary}`);
  console.log(`  [✓] Viability: ${whatIf.viable ? 'FEASIBLE & RISK-MITIGATED' : 'NOT RECOMMENDED'}\n`);

  return { sessions: [s1, s2, s3], whatIf };
}

if (import.meta.main) {
  runFinancialPlannerChallenge().catch(console.error);
}
