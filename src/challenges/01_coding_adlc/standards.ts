import { KnowledgeDoc } from '../../types.ts';

export const CODING_STANDARDS_DOCS: KnowledgeDoc[] = [
  {
    id: 'adr_001_result_monad',
    title: 'ADR-001: Functional Error Handling with Result<T, AppError>',
    category: 'architecture',
    keywords: ['adr', 'error_handling', 'result', 'monad', 'exceptions'],
    content: `
# ADR-001: Functional Error Handling Pattern
Status: ACCEPTED
Context: Unhandled exceptions cause unformatted 500 errors and leaking internal stack traces.
Decision: All public service methods must return Result<T, AppError> instead of throwing bare exceptions.
Consequences: Callers are forced to handle failure branches at compile time.
`
  },
  {
    id: 'adr_002_unit_of_work',
    title: 'ADR-002: Repository & Unit-of-Work Pattern for Data Access',
    category: 'database',
    keywords: ['adr', 'repository', 'unit_of_work', 'sql', 'orm', 'database'],
    content: `
# ADR-002: Repository Pattern
Status: ACCEPTED
Context: Direct SQL queries inside HTTP handlers prevent mocking and cause connection leaks.
Decision: Direct SQL or raw ORM calls in HTTP route controllers are strictly forbidden. All data access must pass through typed Repository interfaces governed by Unit-of-Work transaction management.
`
  },
  {
    id: 'adr_003_secure_headers',
    title: 'ADR-003: Mandatory Security Headers & Rate Limiting Decorators',
    category: 'security',
    keywords: ['adr', 'security', 'headers', 'rate_limit', 'csp'],
    content: `
# ADR-003: Security Hardening
Status: ACCEPTED
Context: API endpoints must defend against clickjacking, MIME sniffing, and burst abuse.
Decision: Every public API route must declare @RateLimit(rpm=100) and include helmet security headers middleware.
`
  }
];
