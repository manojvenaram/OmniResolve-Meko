export interface ResearchTask {
  id: string;
  topic: string;
  domain: string;
  query: string;
  expectedFactCount: number;
}

export const BENCHMARK_RESEARCH_TASKS: ResearchTask[] = [
  { id: 'task_01', topic: 'Distributed Consensus & Raft Latency', domain: 'databases', query: 'Compare multi-raft leader election timeouts in WAN deployments', expectedFactCount: 4 },
  { id: 'task_02', topic: 'OAuth2 RTR Attack Surfaces', domain: 'security', query: 'Identify token reuse vulnerabilities in single page apps', expectedFactCount: 3 },
  { id: 'task_03', topic: 'Stripe Mid-Cycle Prorations', domain: 'billing', query: 'Calculate seat downgrade credit adjustments', expectedFactCount: 3 },
  { id: 'task_04', topic: 'CORS Preflight Caching', domain: 'networking', query: 'Optimize Access-Control-Max-Age for edge API gateways', expectedFactCount: 3 },
  { id: 'task_05', topic: 'Database Connection Pool Starvation', domain: 'databases', query: 'Detect leaked connections in async webhook consumers', expectedFactCount: 4 },
  { id: 'task_06', topic: 'S3 Multipart Presigned Expiry', domain: 'cloud_storage', query: 'Resumable upload part refreshing on slow networks', expectedFactCount: 3 },
  { id: 'task_07', topic: 'ATO Credential Stuffing Signatures', domain: 'security', query: 'Correlate ASN bulletproof proxies with headless browser signatures', expectedFactCount: 4 },
  { id: 'task_08', topic: 'PostgreSQL Idle In Transaction Timeout', domain: 'databases', query: 'Configure statement and session timeouts in YugabyteDB', expectedFactCount: 3 },
  { id: 'task_09', topic: 'HIPAA RBAC Context Boundaries', domain: 'healthcare', query: 'Prevent billing agents from accessing psychiatric clinical notes', expectedFactCount: 4 },
  { id: 'task_10', topic: 'Debt-to-Income Regulatory Caps', domain: 'finance', query: 'Evaluate Fannie Mae conforming mortgage DTI threshold limits', expectedFactCount: 3 }
];
