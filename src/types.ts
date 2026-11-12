export interface SupportTicket {
  id: string;
  clusterId: string;
  title: string;
  customerName: string;
  customerTier: 'standard' | 'enterprise';
  description: string;
  category: 'authentication' | 'webhooks' | 'rate-limiting' | 'billing' | 'cors' | 'database' | 'storage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  errorLogs?: string;
  environment: string;
  createdTimestamp: string;
  isRepeat: boolean;
  repeatOfTicketId?: string;
}

export interface MekoMemory {
  id: string;
  datapackId: string;
  title: string;
  clusterId: string;
  problemSignature: string;
  rootCause: string;
  verifiedFix: string;
  codeSnippet?: string;
  tags: string[];
  confidence: number;
  hitCount: number;
  createdAt: string;
  promotedBy: string; // e.g., 'human_reviewer_secops' or 'lead_support_eng'
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
}

export interface DecisionTrace {
  id: string;
  ticketId: string;
  agentName: 'triage_agent' | 'specialist_agent' | 'hitl_gate';
  action: 'context_search' | 'memory_add' | 'diagnose' | 'verify' | 'resolve';
  inputSummary: string;
  retrievedMemoryIds: string[];
  retrievedDocIds: string[];
  reasoning: string;
  outputSummary: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  timestamp: string;
}

export interface AgentResolution {
  ticketId: string;
  clusterId: string;
  isRepeat: boolean;
  resolvedBy: 'triage_agent' | 'specialist_agent';
  isMemoryHit: boolean;
  matchedMemoryId?: string;
  matchedMemoryTitle?: string;
  rootCause: string;
  resolutionSteps: string[];
  codePatch?: string;
  traces: DecisionTrace[];
  totalTokens: number;
  totalLatencyMs: number;
  toolStepsCount: number;
  hitlApproved: boolean;
  hitlNotes?: string;
}

export interface TicketRunMetrics {
  ticketId: string;
  clusterId: string;
  isRepeat: boolean;
  baselineTokens: number;
  baselineLatencyMs: number;
  baselineSteps: number;
  mekoTokens: number;
  mekoLatencyMs: number;
  mekoSteps: number;
  tokenSavingsPercent: number;
  latencyImprovementPercent: number;
  memoryHit: boolean;
}

export interface BenchmarkSummary {
  totalTickets: number;
  novelTicketsCount: number;
  repeatTicketsCount: number;
  baselineAvgTokensRepeat: number;
  mekoAvgTokensRepeat: number;
  repeatTokenSavingsPercent: number;
  baselineAvgLatencyRepeatMs: number;
  mekoAvgLatencyRepeatMs: number;
  repeatLatencyImprovementPercent: number;
  baselineAvgStepsRepeat: number;
  mekoAvgStepsRepeat: number;
  memoryHitRatePercent: number;
  overallTokenReductionFactor: number;
}

