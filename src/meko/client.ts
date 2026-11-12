import { MekoMemory, KnowledgeDoc, DecisionTrace } from '../types.ts';

export interface MekoConfig {
  datapackId: string;
  apiKey?: string;
  baseUrl?: string;
  useLocalFallback?: boolean;
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
  private memories: Map<string, MekoMemory> = new Map();
  private knowledgeDocs: Map<string, KnowledgeDoc> = new Map();
  private traces: DecisionTrace[] = [];
  private tokenLedger: Map<string, { promptTokens: number; completionTokens: number; totalTokens: number }> = new Map();

  constructor(config: MekoConfig) {
    this.datapackId = config.datapackId || 'omni-resolve-support';
    this.apiKey = config.apiKey || process.env.MEKO_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.mekodata.ai/api/v1';
  }

  public getDatapackId(): string {
    return this.datapackId;
  }

  // Knowledge Base Ingestion
  public async ingestKnowledgeDoc(doc: KnowledgeDoc): Promise<void> {
    this.knowledgeDocs.set(doc.id, doc);
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

    this.memories.set(id, memory);
    return memory;
  }

  public async memoryGet(id: string): Promise<MekoMemory | undefined> {
    return this.memories.get(id);
  }

  public async listAllMemories(): Promise<MekoMemory[]> {
    return Array.from(this.memories.values());
  }

  // Hybrid Context Search (Simulating Meko's Vector + BM25 Hybrid Retrieval)
  public async contextSearch(query: string, options: {
    topKMemories?: number;
    topKDocs?: number;
    minScoreThreshold?: number;
  } = {}): Promise<ContextSearchResult> {
    const topKMemories = options.topKMemories ?? 3;
    const topKDocs = options.topKDocs ?? 3;
    const threshold = options.minScoreThreshold ?? 0.40;

    const queryTokens = this.extractWeightedTokens(query);

    // Score memories
    const scoredMemories: Array<{ memory: MekoMemory; score: number }> = [];
    for (const mem of this.memories.values()) {
      const memoryText = `${mem.title} ${mem.problemSignature} ${mem.rootCause} ${mem.tags.join(' ')}`;
      const memTokens = this.extractWeightedTokens(memoryText);
      const score = this.calculateHybridVectorScore(queryTokens, memTokens, mem.tags, query, memoryText);
      if (score >= threshold) {
        scoredMemories.push({ memory: mem, score });
      }
    }

    scoredMemories.sort((a, b) => b.score - a.score);
    const selectedMemories = scoredMemories.slice(0, topKMemories);

    // Increment hit count
    for (const item of selectedMemories) {
      item.memory.hitCount += 1;
    }

    // Score knowledge base docs
    const scoredDocs: Array<{ doc: KnowledgeDoc; score: number }> = [];
    for (const doc of this.knowledgeDocs.values()) {
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
    const fullTrace: DecisionTrace = {
      ...trace,
      id: `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    this.traces.push(fullTrace);

    const current = this.tokenLedger.get(trace.ticketId) || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    this.tokenLedger.set(trace.ticketId, {
      promptTokens: current.promptTokens + trace.tokenUsage.promptTokens,
      completionTokens: current.completionTokens + trace.tokenUsage.completionTokens,
      totalTokens: current.totalTokens + trace.tokenUsage.totalTokens
    });

    return fullTrace;
  }

  public getTracesForTicket(ticketId: string): DecisionTrace[] {
    return this.traces.filter(t => t.ticketId === ticketId);
  }

  public getAllTraces(): DecisionTrace[] {
    return [...this.traces];
  }

  public getTokenUsage(ticketId: string) {
    return this.tokenLedger.get(ticketId) || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  public resetMemory(): void {
    this.memories.clear();
    this.traces = [];
    this.tokenLedger.clear();
  }

  // Semantic Token Extractor with Technical Term Preservation
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
      's3', 'presigned', 'multipart', 'expired', 'upload', 'skew', 'chunk'
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

    // Tag matching boost
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
