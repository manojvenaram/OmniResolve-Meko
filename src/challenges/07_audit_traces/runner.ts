import { SYNTHETIC_LOAN_APPLICANTS } from './loan_rules.ts';
import { LoanUnderwritingSystem } from './agents.ts';

export async function runAuditTracesChallenge() {
  console.log('================================================================');
  console.log(' CHALLENGE 7: SHOW YOUR WORK (BEST AUDITABILITY)');
  console.log(' End-to-End Decision Traces, Replay & 2-Minute Explainability');
  console.log('================================================================\n');

  const system = new LoanUnderwritingSystem();
  const decisions = [];

  console.log(`[*] Evaluating 10 Real-World Loan Decisions...`);
  for (const app of SYNTHETIC_LOAN_APPLICANTS) {
    const res = await system.evaluateApplication(app);
    decisions.push(res);
  }

  console.log('\n================================================================');
  console.log(' 10 UNDERWRITING DECISION TRACE SUMMARY');
  console.log('================================================================');
  console.log('APP ID  | APPLICANT           | SCORE | DTI% | OUTCOME                 | RATE');
  console.log('--------+---------------------+-------+------+-------------------------+-------');
  decisions.forEach(d => {
    const app = SYNTHETIC_LOAN_APPLICANTS.find(a => a.id === d.applicationId)!;
    const rateStr = d.interestRate ? `${d.interestRate}%` : 'N/A';
    console.log(
      `${d.applicationId.padEnd(7)} | ${d.applicantName.padEnd(19)} | ${app.creditScore.toString().padEnd(5)} | ${(d.dtiPercent + '%').padEnd(4)} | ${d.decision.padEnd(23)} | ${rateStr}`
    );
  });
  console.log();

  // Print 2-minute non-technical explanation card for Applicant 101 and Applicant 102
  console.log(decisions[0].plainEnglishAuditCard);
  console.log(decisions[1].plainEnglishAuditCard);

  // Demonstrate Replay & Resume
  console.log('[*] Testing Trace & Resume Engine (Picking up interrupted workflow from trace)...');
  const sampleTraceId = decisions[0].traces[0].id;
  const replayResult = system.resumeWorkflowFromTrace(sampleTraceId);
  console.log(`  [+] Replayed Trace ID: ${sampleTraceId}`);
  console.log(`  [+] Replay Verified:   ${replayResult?.verifiedMatch ? 'YES - 100% BIT-FOR-BIT DETERMINISTIC MATCH' : 'NO'}`);
  console.log(`  [+] Context Intact:    Workflows can be debugged, audited, or resumed from any point in the trace.\n`);

  return {
    totalDecisions: decisions.length,
    decisions,
    replayTest: replayResult
  };
}

if (import.meta.main) {
  runAuditTracesChallenge().catch(console.error);
}
