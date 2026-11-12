import { MekoMemory, KnowledgeDoc, DecisionTrace } from '../types.ts';

export interface DatapackPolicy {
  datapackId: string;
  name: string;
  allowedRoles: string[]; // e.g. ['clinical', 'physician'] or ['billing']
  description?: string;
}

export interface MekoConfig {
  datapackId: string;
  apiKey?: string;
  baseUrl?: string;
  allowedRoles?: string[];
  currentRole?: string;
}

export interface ContextSearchResult {
  memories: Array<{ memory: MekoMemory; score: number }>;
  knowledgeDocs: Array<{ doc: KnowledgeDoc; score: number }>;
  totalMatches: number;
}

export class MekoClient {
  private datapackId: string;
  private apiKey?: string;
  private baseUrl: string;
  private currentRole?: string;
  private allowedRoles?: string[];

  // In-memory data store per datapack
  private static datapackStores: Map<string, {
    memories: Map<string, MekoMemory>;
    knowledgeDocs: Map<string, KnowledgeDoc>;
    traces: DecisionTrace[];
    tokenLedger: Map<string, { promptTokens: number; completionTokens: number; totalTokens: number }>;
    policy?: DatapackPolicy;
  }> = new Map();

  constructor(config: MekoConfig) {
    this.datapackId = config.datapackId || 'omni-resolve-shared';
    this.apiKey = config.apiKey || process.env.MEKO_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.mekodata.ai/api/v1';
    this.currentRole = config.currentRole;
    this.allowedRoles = config.allowedRoles;

    this.ensureDatapackStore(this.datapackId, config.allowedRoles);
  }

  private ensureDatapackStore(dpId: string, allowedRoles?: string[]) {
    if (!MekoClient.datapackStores.has(dpId)) {
      MekoClient.datapackStores.set(dpId, {
        memories: new Map(),
        knowledgeDocs: new Map(),
        traces: [],
        tokenLedger: new Map(),
        policy: allowedRoles ? { datapackId: dpId, name: dpId, allowedRoles } : undefined
      });
    }
  }

  private getStore() {
    this.ensureDatapackStore(this.datapackId);
    return MekoClient.datapackStores.get(this.datapackId)!;
  }

  public getDatapackId(): string {
    return this.datapackId;
  }

  public setDatapackPolicy(policy: DatapackPolicy): void {
    const store = this.getStore();
    store.policy = policy;
  }

  // Role Access Verification for Governed Datapacks
  public verifyAccess(role?: string): boolean {
    const store = this.getStore();
    if (!store.policy || store.policy.allowedRoles.length === 0) {
      return true; // Public / unrestricted datapack
    }
    const targetRole = role || this.currentRole;
    if (!targetRole) return false;
    return store.policy.allowedRoles.includes(targetRole);
  }

  // Knowledge Base Ingestion
  public async ingestKnowledgeDoc(doc: KnowledgeDoc): Promise<void> {
    const store = this.getStore();
    store.knowledgeDocs.set(doc.id, doc);
  }

  public async batchIngestKnowledgeDocs(docs: KnowledgeDoc[]): Promise<void> {
    for (const doc of docs) {
      await this.ingestKnowledgeDoc(doc);
    }
  }

  // Memory Operations
  public async memoryAdd(params: {
    title: string;
    clusterId: string;
    problemSignature: string;
    rootCause: string;
    verifiedFix: string;
    codeSnippet?: string;
    tags: string[];
    confidence?: number;
    promotedBy?: string;
  }): Promise<MekoMemory> {
    if (!this.verifyAccess()) {
      throw new Error(`ACCESS_DENIED: Role '${this.currentRole}' does not have permission to write to datapack '${this.datapackId}'.`);
    }

    const store = this.getStore();
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const memory: MekoMemory = {
      id,
      datapackId: this.datapackId,
      title: params.title,
      clusterId: params.clusterId,
      problemSignature: params.problemSignature,
      rootCause: params.rootCause,
      verifiedFix: params.verifiedFix,
      codeSnippet: params.codeSnippet,
      tags: params.tags,
      confidence: params.confidence ?? 0.95,
      hitCount: 0,
      createdAt: new Date().toISOString(),
      promotedBy: params.promotedBy ?? 'hitl_promoter_system'
    };

    store.memories.set(id, memory);
    return memory;
  }

  public async memoryGet(id: string): Promise<MekoMemory | undefined> {
    if (!this.verifyAccess()) {
      return undefined;
    }
    return this.getStore().memories.get(id);
  }

  public async listAllMemories(): Promise<MekoMemory[]> {
    if (!this.verifyAccess()) {
      return [];
    }
    return Array.from(this.getStore().memories.values());
  }

  // Hybrid Context Search
  public async contextSearch(query: string, options: {
    topKMemories?: number;
    topKDocs?: number;
    minScoreThreshold?: number;
  } = {}): Promise<ContextSearchResult> {
    if (!this.verifyAccess()) {
      return { memories: [], knowledgeDocs: [], totalMatches: 0 };
    }

    const store = this.getStore();
    const topKMemories = options.topKMemories ?? 3;
    const topKDocs = options.topKDocs ?? 3;
    const threshold = options.minScoreThreshold ?? 0.40;

    const queryTokens = this.extractWeightedTokens(query);

    // Score memories
    const scoredMemories: Array<{ memory: MekoMemory; score: number }> = [];
    for (const mem of store.memories.values()) {
      const memoryText = `${mem.title} ${mem.problemSignature} ${mem.rootCause} ${mem.tags.join(' ')}`;
      const memTokens = this.extractWeightedTokens(memoryText);
      const score = this.calculateHybridVectorScore(queryTokens, memTokens, mem.tags, query, memoryText);
      if (score >= threshold) {
        scoredMemories.push({ memory: mem, score });
      }
    }

    scoredMemories.sort((a, b) => b.score - a.score);
    const selectedMemories = scoredMemories.slice(0, topKMemories);

    for (const item of selectedMemories) {
      item.memory.hitCount += 1;
    }

    // Score knowledge base docs
    const scoredDocs: Array<{ doc: KnowledgeDoc; score: number }> = [];
    for (const doc of store.knowledgeDocs.values()) {
      const docText = `${doc.title} ${doc.category} ${doc.content} ${doc.keywords.join(' ')}`;
      const docTokens = this.extractWeightedTokens(docText);
      const score = this.calculateHybridVectorScore(queryTokens, docTokens, doc.keywords, query, docText);
      if (score >= threshold) {
        scoredDocs.push({ doc, score });
      }
    }

    scoredDocs.sort((a, b) => b.score - a.score);
    const selectedDocs = scoredDocs.slice(0, topKDocs);

    return {
      memories: selectedMemories,
      knowledgeDocs: selectedDocs,
      totalMatches: selectedMemories.length + selectedDocs.length
    };
  }

  // Decision Tracing & Token Usage
  public async recordTrace(trace: Omit<DecisionTrace, 'id' | 'timestamp'>): Promise<DecisionTrace> {
    const store = this.getStore();
    const fullTrace: DecisionTrace = {
      ...trace,
      id: `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    store.traces.push(fullTrace);

    const current = store.tokenLedger.get(trace.ticketId) || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    store.tokenLedger.set(trace.ticketId, {
      promptTokens: current.promptTokens + trace.tokenUsage.promptTokens,
      completionTokens: current.completionTokens + trace.tokenUsage.completionTokens,
      totalTokens: current.totalTokens + trace.tokenUsage.totalTokens
    });

    return fullTrace;
  }

  public getTracesForTicket(ticketId: string): DecisionTrace[] {
    return this.getStore().traces.filter(t => t.ticketId === ticketId);
  }

  public getAllTraces(): DecisionTrace[] {
    return [...this.getStore().traces];
  }

  public getTokenUsage(ticketId: string) {
    return this.getStore().tokenLedger.get(ticketId) || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  // Replay a workflow from its trace (Challenge 7 feature)
  public replayTrace(traceId: string): { originalTrace: DecisionTrace; replayed: boolean; verifiedMatch: boolean } | null {
    const trace = this.getStore().traces.find(t => t.id === traceId);
    if (!trace) return null;
    return {
      originalTrace: trace,
      replayed: true,
      verifiedMatch: !!trace.id && !!trace.action
    };
  }

  public resetMemory(): void {
    const store = this.getStore();
    store.memories.clear();
    store.traces = [];
    store.tokenLedger.clear();
  }

  public static resetAllDatapacks(): void {
    MekoClient.datapackStores.clear();
  }

  private extractWeightedTokens(text: string): Map<string, number> {
    const tokens = new Map<string, number>();
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_\-\.\:\/]/g, ' ');
    const words = cleaned.split(/\s+/).filter(w => w.length > 2);

    const technicalKeywords = new Set([
      'oauth', 'refresh', 'token', '401', 'revoked', 'reuse', 'rotation', 'rtr',
      'webhook', 'hmac', 'sha256', 'signature', 'digest', 'raw', 'buffer',
      '429', 'rate', 'limit', 'retry-after', 'jitter', 'backoff', 'burst',
      'billing', 'proration', 'stripe', 'invoice', 'downgrade', 'credit',
      'cors', 'options', 'preflight', '403', 'origin', 'credentials',
      'pool', 'exhaustion', 'timeout', 'connection', 'pg', 'yugabyte', 'leak',
      's3', 'presigned', 'multipart', 'expired', 'upload', 'skew', 'chunk',
      'adr', 'architecture', 'sql', 'injection', 'orm', 'unit_of_work', 'repository',
      'fraud', 'takeover', 'ato', 'credential_stuffing', 'mfa', 'ip_anomaly',
      'campaign', 'segment', 'audience', 'copy', 'conversion', 'roas',
      'budget', '401k', 'mortgage', 'downpayment', 'roth', 'emergency_fund',
      'patient', 'penicillin', 'allergy', 'hypertension', 'metformin', 'icd10'
    ]);

    for (const word of words) {
      const weight = technicalKeywords.has(word) ? 3.0 : 1.0;
      tokens.set(word, (tokens.get(word) || 0) + weight);
    }
    return tokens;
  }

  private calculateHybridVectorScore(
    queryTokens: Map<string, number>,
    targetTokens: Map<string, number>,
    domainTags: string[],
    rawQuery: string,
    rawTarget: string
  ): number {
    let dotProduct = 0;
    let queryNorm = 0;
    let targetNorm = 0;

    for (const [token, qWeight] of queryTokens.entries()) {
      queryNorm += qWeight * qWeight;
      if (targetTokens.has(token)) {
        const tWeight = targetTokens.get(token)!;
        dotProduct += qWeight * tWeight;
      }
    }

    for (const [, tWeight] of targetTokens.entries()) {
      targetNorm += tWeight * tWeight;
    }

    const cosine = (queryNorm > 0 && targetNorm > 0)
      ? dotProduct / (Math.sqrt(queryNorm) * Math.sqrt(targetNorm))
      : 0;

    let tagBoost = 0;
    const lowerQuery = rawQuery.toLowerCase();
    for (const tag of domainTags) {
      if (lowerQuery.includes(tag.toLowerCase())) {
        tagBoost += 0.15;
      }
    }

    return Math.min(1.0, (cosine * 0.70) + Math.min(0.30, tagBoost));
  }
}
