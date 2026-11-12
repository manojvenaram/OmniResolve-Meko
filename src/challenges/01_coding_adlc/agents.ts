import { MekoClient } from '../../meko/client.ts';
import { DecisionTrace } from '../../types.ts';

export interface CodeProposal {
  authorAgent: 'cursor_agent' | 'claude_code_agent';
  featureName: string;
  codeSnippet: string;
  conformsToStandards: boolean;
  violations: string[];
}

export interface ReviewResult {
  approved: boolean;
  violationsFound: string[];
  reviewedAgainstMemories: string[];
  trace: DecisionTrace;
  explanation: string;
}

// Agent 1: Cursor IDE Agent
export class CursorAgent {
  private mekoClient: MekoClient;

  constructor(mekoClient: MekoClient) {
    this.mekoClient = mekoClient;
  }

  // Learns / codifies a new team architecture decision
  public async codifyArchitectureDecision(adr: {
    adrId: string;
    title: string;
    rule: string;
    tags: string[];
  }) {
    const memory = await this.mekoClient.memoryAdd({
      title: `${adr.adrId}: ${adr.title}`,
      clusterId: 'adlc_coding_standards',
      problemSignature: `Team architectural constraint: ${adr.rule}`,
      rootCause: 'Prevent architectural drift and inconsistent patterns across developer tools',
      verifiedFix: adr.rule,
      codeSnippet: `// Example Conforming Pattern for ${adr.adrId}\nexport class ConformingService { /* conforms to ${adr.rule} */ }`,
      tags: ['adr', 'architecture', 'standards', ...adr.tags],
      confidence: 1.0,
      promotedBy: 'cursor_ide_lead_architect'
    });

    await this.mekoClient.recordTrace({
      ticketId: adr.adrId,
      agentName: 'triage_agent', // represents dev agent
      action: 'memory_add',
      inputSummary: `Cursor IDE codified ${adr.adrId}`,
      retrievedMemoryIds: [memory.id],
      retrievedDocIds: [],
      reasoning: `Architect defined convention in IDE. Saved to shared Meko Datapack so terminal (Claude Code) and CI agents follow it immediately.`,
      outputSummary: `Durable team memory established: ${memory.id}`,
      tokenUsage: { promptTokens: 320, completionTokens: 140, totalTokens: 460 },
      latencyMs: 120
    });

    return memory;
  }
}

// Agent 2: Claude Code CLI Terminal Agent
export class ClaudeCodeAgent {
  private mekoClient: MekoClient;

  constructor(mekoClient: MekoClient) {
    this.mekoClient = mekoClient;
  }

  public async implementFeature(featureName: string, queryMeko: boolean): Promise<CodeProposal> {
    if (!queryMeko) {
      // Baseline: Starts from zero without shared context -> makes standard naive mistakes
      return {
        authorAgent: 'claude_code_agent',
        featureName,
        codeSnippet: `
// Implemented WITHOUT Meko Context (Drifted)
app.post('/api/v1/payments/process', async (req, res) => {
  // VIOLATION: Direct raw SQL query inside HTTP route handler
  const user = await db.query("SELECT * FROM users WHERE id = '" + req.body.userId + "'");
  if (!user) {
    throw new Error("User not found"); // VIOLATION: Bare exception instead of Result<T>
  }
  return res.json({ success: true });
});`,
        conformsToStandards: false,
        violations: [
          'Violates ADR-002: Direct raw SQL inside HTTP controller instead of Repository pattern',
          'Violates ADR-001: Threw naked Error instead of Result<T, AppError>'
        ]
      };
    }

    // With Meko: Queries shared datapack before writing code
    const context = await this.mekoClient.contextSearch(`architecture standards repository error handling ${featureName}`, {
      topKMemories: 2,
      topKDocs: 2
    });

    const retrievedMemories = context.memories.map(m => m.memory.title);

    await this.mekoClient.recordTrace({
      ticketId: `feat_${featureName}`,
      agentName: 'specialist_agent',
      action: 'context_search',
      inputSummary: `Claude Code queried team standards for "${featureName}"`,
      retrievedMemoryIds: context.memories.map(m => m.memory.id),
      retrievedDocIds: context.knowledgeDocs.map(d => d.doc.id),
      reasoning: `Retrieved team standards: ${retrievedMemories.join(', ')}. Scaffolding implementation adhering strictly to Unit-of-Work and Result monad.`,
      outputSummary: `Generated standards-compliant code with 0 violations.`,
      tokenUsage: { promptTokens: 620, completionTokens: 410, totalTokens: 1030 },
      latencyMs: 340
    });

    return {
      authorAgent: 'claude_code_agent',
      featureName,
      codeSnippet: `
// Implemented WITH Meko Context (Standards-Compliant)
import { Result, ok, err } from '@/core/result';
import { PaymentRepository } from '@/repositories/payment.repository';
import { UnitOfWork } from '@/core/unit-of-work';

export class PaymentController {
  constructor(private uow: UnitOfWork, private paymentRepo: PaymentRepository) {}

  @RateLimit({ rpm: 100 })
  async processPayment(req: Request): Promise<Result<PaymentResponse, AppError>> {
    return this.uow.runInTransaction(async (session) => {
      const userResult = await this.paymentRepo.findUserById(req.body.userId, session);
      if (!userResult.ok) {
        return err(new UserNotFoundError(req.body.userId));
      }
      return ok({ transactionId: 'txn_9821', status: 'completed' });
    });
  }
}`,
      conformsToStandards: true,
      violations: []
    };
  }
}

// Agent 3: Automated PR Review Agent (CI/CD)
export class PRReviewAgent {
  private mekoClient: MekoClient;

  constructor(mekoClient: MekoClient) {
    this.mekoClient = mekoClient;
  }

  public async reviewPullRequest(proposal: CodeProposal): Promise<ReviewResult> {
    const startTime = performance.now();
    const context = await this.mekoClient.contextSearch(`code review standards ${proposal.featureName}`, {
      topKMemories: 3
    });

    const reviewedAgainst = context.memories.map(m => m.memory.title);
    const hasViolations = proposal.violations.length > 0;
    const latency = Math.round(performance.now() - startTime);

    const trace = await this.mekoClient.recordTrace({
      ticketId: `pr_review_${proposal.featureName}`,
      agentName: 'hitl_gate',
      action: 'verify',
      inputSummary: `Automated PR review for feature ${proposal.featureName} by ${proposal.authorAgent}`,
      retrievedMemoryIds: context.memories.map(m => m.memory.id),
      retrievedDocIds: [],
      reasoning: hasViolations
        ? `Flagged ${proposal.violations.length} critical architectural violations against Meko standards.`
        : `Verified 100% compliance against team ADRs codified in Meko datapack.`,
      outputSummary: hasViolations ? 'PR Rejected (Action Required)' : 'PR Approved for Merge',
      tokenUsage: { promptTokens: 480, completionTokens: 180, totalTokens: 660 },
      latencyMs: latency
    });

    return {
      approved: !hasViolations,
      violationsFound: proposal.violations,
      reviewedAgainstMemories: reviewedAgainst,
      trace,
      explanation: hasViolations
        ? `PR REJECTED: Found ${proposal.violations.length} architectural violations against team decisions stored in Meko: \n- ${proposal.violations.join('\n- ')}`
        : `PR APPROVED: Code strictly satisfies all team ADRs stored in Meko. Zero rework required.`
    };
  }
}
