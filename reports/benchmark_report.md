
# OmniResolve Benchmark Report: Never Solve It Twice
**Hackathon:** ContextCon 2026 (YugabyteDB & Meko)  
**Dataset:** 35 Synthetic Tickets across 7 Failure Clusters  
**Author:** manojvenaram  

## Executive Summary Metrics
- **Overall Token Reduction Factor:** **2.79x**
- **Token Reduction on Repeat Issues:** **-80.2%**
- **Average Tool Steps on Repeat Issues:** **4 &rarr; 1.1 step**
- **Memory Hit Rate on Variant Issues:** **96.4%**
- **Latency Improvement on Repeat Issues:** **-83.5%**

## Detailed Statistical Results
| Metric | Baseline (No Memory) | OmniResolve (Meko Shared Memory) | Delta / Improvement |
| :--- | :--- | :--- | :--- |
| **Novel Issue Resolution Tokens** | ~4,980 | ~5,120 (incl. promotion) | +2.8% (one-time investment) |
| **Repeat Issue Resolution Tokens** | 5,100 | **1,011** | **-80.2%** |
| **Repeat Issue Tool Steps** | 4 | **1.1** | **-73%** |
| **Repeat Issue Resolution Latency** | 3103ms | **512ms** | **-83.5%** |
| **Decision Trace Auditability** | 0% (Scattered logs) | **100% Traceable** | Full Meko Decision Traces |

## Cluster-by-Cluster Breakdown
| Cluster ID | Category | Tickets | Baseline Total Tokens | Meko Total Tokens | Savings |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cluster_oauth_refresh` | oauth_refresh | 5 | 25,500 | 8,540 | **-66.5%** |
| `cluster_webhook_hmac` | webhook_hmac | 5 | 25,500 | 8,540 | **-66.5%** |
| `cluster_rate_limiting` | rate_limiting | 5 | 25,500 | 8,540 | **-66.5%** |
| `cluster_billing_proration` | billing_proration | 5 | 25,500 | 8,540 | **-66.5%** |
| `cluster_cors_options` | cors_options | 5 | 25,500 | 12,780 | **-49.9%** |
| `cluster_db_pooling` | db_pooling | 5 | 25,500 | 8,540 | **-66.5%** |
| `cluster_s3_presigned` | s3_presigned | 5 | 25,500 | 8,540 | **-66.5%** |

*Generated automatically by OmniResolve Benchmark Engine for ContextCon 2026.*
