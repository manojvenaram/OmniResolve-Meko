import { KnowledgeDoc } from '../types.ts';

export const ENTERPRISE_KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    id: 'kb_auth_oauth_01',
    title: 'OAuth 2.0 Token Refresh & Race Condition Handling',
    category: 'authentication',
    keywords: ['oauth', 'refresh_token', 'token_revoked', 'race_condition', '401_unauthorized', 'jwt', 'auth'],
    content: `
# OAuth 2.0 Token Refresh Architecture

When concurrent client requests encounter an expired access token, multiple threads may simultaneously attempt to refresh using the same refresh token.

### Standard Failure Mode:
When Refresh Token Rotation (RTR) is enforced, using a previously consumed refresh token triggers an immediate security alert: 'Token Reuse Detected', revoking the entire token family and logging out the user.

### Correct Implementation:
1. Implement client-side in-flight refresh request locking (single-flight pattern).
2. Store the pending refresh promise and attach subsequent 401 interceptors to the existing promise.
3. Allow a grace period (leeway window) of 30 seconds on the auth server for in-transit concurrent requests before invalidating the previous refresh token.
4. Provide an idempotency key during POST /oauth/v2/token to deduplicate rapid concurrent attempts.
`
  },
  {
    id: 'kb_webhooks_hmac_02',
    title: 'Webhook Signature Verification & Raw Body Handling',
    category: 'webhooks',
    keywords: ['webhook', 'hmac', 'sha256', 'signature_verification_failed', 'raw_body', 'body_parser', 'digest'],
    content: `
# Webhook HMAC-SHA256 Signature Verification

All incoming webhooks contain the 'X-Hub-Signature-256' header containing the hex digest of the HMAC-SHA256 signature calculated with the webhook secret.

### Common Pitfalls:
1. Body-parser middleware (e.g., Express json(), Fastify, Koa) parses and re-serializes JSON, which reorders keys, alters whitespace, or strips trailing newlines.
2. Even a single differing byte causes the HMAC digest comparison to fail, resulting in '400 Bad Request: Invalid Signature'.

### Standard Resolution:
1. Capture the raw unparsed request Buffer prior to any JSON decoding using verify hook or raw body parser.
2. Calculate HMAC: crypto.createHmac('sha256', secret).update(rawBuffer).digest('hex').
3. Use crypto.timingSafeEqual() to prevent timing attack vulnerabilities.
`
  },
  {
    id: 'kb_rate_limiting_03',
    title: 'API Rate Limiting, 429 Status & Exponential Jitter Backoff',
    category: 'rate-limiting',
    keywords: ['rate_limit', '429_too_many_requests', 'retry_after', 'burst_limiter', 'exponential_backoff', 'jitter'],
    content: `
# API Rate Limiting Specifications

The platform enforces tiered rate limits via Redis Token Bucket:
- Standard Tier: 100 requests / minute, burst limit 25.
- Enterprise Tier: 5,000 requests / minute, burst limit 500.

### Response Headers:
- X-RateLimit-Limit: Total allowed quota.
- X-RateLimit-Remaining: Tokens remaining in current window.
- X-RateLimit-Reset: Epoch timestamp when bucket refills.
- Retry-After: Integer seconds or HTTP-date before retrying.

### Client Guidelines:
Clients receiving 429 MUST pause requests for the duration indicated in Retry-After. For distributed workers, implement Full Jitter Exponential Backoff:
sleep_time = min(max_backoff, base_backoff * (2 ** retry_attempt))
sleep_time = random_uniform(0, sleep_time)
`
  },
  {
    id: 'kb_billing_stripe_04',
    title: 'Subscription Proration, Seat Downgrades & Invoice Previews',
    category: 'billing',
    keywords: ['proration', 'stripe', 'invoice', 'downgrade', 'credit_balance', 'billing_cycle', 'refund'],
    content: `
# Subscription Prorations & Mid-Cycle Tier Changes

When a customer changes subscription tiers or removes user seats mid-billing cycle:
1. If proration_behavior='create_prorations', an unused time credit item is created for the old tier, and a prorated debit is calculated for the new tier.
2. Proration credits do NOT automatically trigger cash refunds; they are credited to the customer account's available balance for subsequent invoices.
3. Mid-cycle downgrades can leave a pending invoice credit. To preview the net balance change before charging the customer, invoke:
   stripe.invoices.retrieveUpcoming({ customer: cust_id, subscription: sub_id, subscription_items: [...] })
4. Setting proration_date ensures the calculation reflects the exact timestamp of user action rather than invoice generation time.
`
  },
  {
    id: 'kb_cors_networking_05',
    title: 'Cross-Origin Resource Sharing (CORS) & Preflight OPTIONS',
    category: 'cors',
    keywords: ['cors', 'options', 'preflight', 'access_control_allow_origin', '403_forbidden', 'gateway', 'headers'],
    content: `
# Cross-Origin Resource Sharing (CORS) Configuration

Browser web clients executing non-simple HTTP requests (custom headers like Authorization, Content-Type: application/json, or methods PUT/DELETE) send an HTTP OPTIONS preflight request.

### Gateway Failure Modes:
1. Reverse proxy (NGINX, Cloudflare, AWS API Gateway) intercepts the OPTIONS preflight and returns 403 Forbidden because authentication headers are intentionally omitted by browsers during preflight.
2. Access-Control-Allow-Origin cannot be '*' if Access-Control-Allow-Credentials is 'true'; it must explicitly mirror the incoming request Origin.

### Configuration Standard:
- Intercept OPTIONS at the outermost edge proxy and return HTTP 204 No Content immediately.
- Headers required: Access-Control-Allow-Origin: <origin>, Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-ID.
`
  },
  {
    id: 'kb_database_pooling_06',
    title: 'PostgreSQL & YugabyteDB Connection Pool Management',
    category: 'database',
    keywords: ['connection_pool', 'pool_exhaustion', 'timeout', 'transaction_leak', 'yugabyte', 'postgres', 'max_connections'],
    content: `
# Database Connection Pooling Best Practices

Connection pool exhaustion occurs when server workers acquire a connection from the pool but fail to release it back under error conditions or long-running tasks.

### Failure Symptoms:
- Error: 'TimeoutError: ResourceRequest timed out after 30000ms'
- Pool stats indicate: active: 50, idle: 0, waiting: 142.

### Remediation Protocol:
1. Always acquire connections inside try...finally blocks or use scoped connection loaners:
   const client = await pool.connect();
   try { await client.query(...); } finally { client.release(); }
2. Set statement_timeout = '15s' and idle_in_transaction_session_timeout = '30s' on the database server to automatically kill leaked hanging transactions.
3. Scale connection pooling with external pooler (e.g., PgBouncer or Yugabyte Smart Client) instead of bloating application worker pools.
`
  },
  {
    id: 'kb_storage_s3_07',
    title: 'S3 Presigned URL Expiration & Multipart Upload Resumption',
    category: 'storage',
    keywords: ['s3', 'presigned_url', 'upload', 'multipart', 'request_has_expired', 'signature_expired', 'storage'],
    content: `
# Cloud Object Storage & Presigned Upload Lifecycle

When uploading large assets directly from client applications to S3 or Cloud Storage buckets:
1. Presigned PUT URLs have an explicit expiration duration set by the generating server (default: 900 seconds / 15 minutes).
2. If network throughput fluctuates or file sizes exceed 100MB, the upload may extend past the signature expiration window, producing:
   '403 Forbidden: Request has expired'.

### Architectural Standard:
1. For files > 50MB, mandate Multipart Upload API:
   - Client requests InitiateMultipartUpload -> receives UploadId.
   - For each 10MB chunk, client requests a presigned UploadPart URL with short 10-minute validity just-in-time before uploading that part.
   - Client sends CompleteMultipartUpload when all parts succeed.
2. In-transit expired chunks can be refreshed and retried individually without discarding the entire upload.
`
  }
];

