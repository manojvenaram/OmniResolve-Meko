import { MekoClient } from '../../meko/client.ts';
import { HouseholdFinancialState } from './profile.ts';
import { DecisionTrace } from '../../types.ts';

export interface PlanningRecommendation {
  sessionId: string;
  sessionTitle: string;
  lifeEventOccurred?: string;
  monthlySavingsAllocated: number;
  debtPaymentAllocated: number;
  retirementAllocated: number;
  education529Allocated: number;
  reasoningTraces: string[];
}

export class CollaborativeFinancialPlanner {
  private mekoClient: MekoClient;

  constructor() {
    this.mekoClient = new MekoClient({ datapackId: 'financial-planning-household' });
  }

  // Session 1: Establish baseline long-term memory
  public async runSession1InitialPlan(state: HouseholdFinancialState): Promise<PlanningRecommendation> {
    const memory = await this.mekoClient.memoryAdd({
      title: `Household Profile: ${state.householdName}`,
      clusterId: 'financial_household_goals',
      problemSignature: `Income $${state.annualIncome}, Debt $${state.studentLoanDebt}, Emergency $${state.emergencyFund}`,
      rootCause: 'Initial financial milestone establishment',
      verifiedFix: `Allocate $1,400/mo aggressively to student loans; $600/mo to emergency cushion`,
      tags: ['budget', 'household', 'debt', 'student_loans', 'alex_morgan']
    });

    const trace = await this.mekoClient.recordTrace({
      ticketId: 'session_01_baseline',
      agentName: 'specialist_agent',
      action: 'resolve',
      inputSummary: `Session 1: Initial baseline financial strategy formulation`,
      retrievedMemoryIds: [memory.id],
      retrievedDocIds: [],
      reasoning: `No dependents currently. Emergency fund is healthy ($25k). Prioritizing high-interest student debt payoff before home purchase.`,
      outputSummary: `Allocated $1,400/mo debt, $600/mo emergency, $800/mo 401(k).`,
      tokenUsage: { promptTokens: 380, completionTokens: 190, totalTokens: 570 },
      latencyMs: 140
    });

    return {
      sessionId: 'session_1',
      sessionTitle: 'Session 1: Initial Baseline Debt Elimination',
      monthlySavingsAllocated: 600,
      debtPaymentAllocated: 1400,
      retirementAllocated: 800,
      education529Allocated: 0,
      reasoningTraces: [trace.reasoning]
    };
  }

  // Session 2: Life Event Adaptation - Baby Arrives
  public async runSession2BabyLifeEvent(): Promise<PlanningRecommendation> {
    // Interrogate Meko memory for past goals
    const context = await this.mekoClient.contextSearch('budget household debt alex_morgan student_loans', {
      topKMemories: 2
    });
    const pastMemory = context.memories[0]?.memory;

    // Adapt plan: Pause aggressive debt payoff, reallocate to child care & 529 plan
    const newMemory = await this.mekoClient.memoryAdd({
      title: 'Life Event: Baby Born (New Dependent Added)',
      clusterId: 'financial_household_goals',
      problemSignature: 'Child birth increases monthly recurring medical & care costs by $700/mo',
      rootCause: 'Shift financial strategy to accommodate dependent while protecting core savings',
      verifiedFix: 'Reduce debt payoff from $1,400 to $700; allocate $400 to 529 college plan, $300 to child care',
      tags: ['budget', 'baby', 'dependent', '529', 'alex_morgan']
    });

    const trace = await this.mekoClient.recordTrace({
      ticketId: 'session_02_baby_event',
      agentName: 'specialist_agent',
      action: 'resolve',
      inputSummary: `Session 2: Adapting plan to baby arrival`,
      retrievedMemoryIds: [pastMemory ? pastMemory.id : '', newMemory.id].filter(Boolean),
      retrievedDocIds: [],
      reasoning: `Retrieved past goal from Session 1: "${pastMemory?.verifiedFix}". Adapting dynamically: child increases recurring costs. Scaled back aggressive student debt from $1,400 -> $700 without stopping amortization. Seeded 529 plan with $400/mo.`,
      outputSummary: `Preserved emergency fund while creating child education runway.`,
      tokenUsage: { promptTokens: 490, completionTokens: 220, totalTokens: 710 },
      latencyMs: 160
    });

    return {
      sessionId: 'session_2',
      sessionTitle: 'Session 2: Life Event Adaptation (New Baby)',
      lifeEventOccurred: 'First Child Born',
      monthlySavingsAllocated: 500,
      debtPaymentAllocated: 700,
      retirementAllocated: 800,
      education529Allocated: 400,
      reasoningTraces: [trace.reasoning]
    };
  }

  // Session 3: Life Event Adaptation - Promotion +$40k
  public async runSession3PromotionLifeEvent(): Promise<PlanningRecommendation> {
    const context = await this.mekoClient.contextSearch('baby 529 student_loans alex_morgan debt', {
      topKMemories: 3
    });

    const trace = await this.mekoClient.recordTrace({
      ticketId: 'session_03_promotion',
      agentName: 'specialist_agent',
      action: 'resolve',
      inputSummary: `Session 3: Incorporating $40,000 promotion raise`,
      retrievedMemoryIds: context.memories.map(m => m.memory.id),
      retrievedDocIds: [],
      reasoning: `Retrieved cumulative household history from Sessions 1 & 2. Extra net monthly cash flow is +$2,200/mo. Resuming student debt acceleration ($1,500/mo to eliminate remaining $18k in 12 months) and boosting 529 to $600/mo.`,
      outputSummary: `Debt payoff finish line accelerated to Dec 2027; home downpayment resumes.`,
      tokenUsage: { promptTokens: 540, completionTokens: 250, totalTokens: 790 },
      latencyMs: 180
    });

    return {
      sessionId: 'session_3',
      sessionTitle: 'Session 3: Career Promotion Acceleration',
      lifeEventOccurred: 'Promotion to VP (+ $40,000 / yr)',
      monthlySavingsAllocated: 1200,
      debtPaymentAllocated: 1500,
      retirementAllocated: 1100,
      education529Allocated: 600,
      reasoningTraces: [trace.reasoning]
    };
  }

  // What-If Scenario Planner
  public runWhatIfScenario(scenarioName: string): { scenario: string; impactSummary: string; viable: boolean } {
    if (scenarioName === 'sabbatical_6mo') {
      return {
        scenario: 'Alex takes a 6-month unpaid sabbatical',
        impactSummary: 'Emergency fund ($25k) covers 4.2 months of fixed expenses. Recommendation: Pause 529 contributions ($600/mo) and drop student loans to minimum $320/mo to stretch runway to 8.1 months without incurring high-interest debt.',
        viable: true
      };
    }
    return {
      scenario: scenarioName,
      impactSummary: 'Standard projection maintained.',
      viable: true
    };
  }
}
