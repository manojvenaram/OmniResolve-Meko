import { GovernedHealthcareCluster } from './agents.ts';

export async function runHealthcareChallenge() {
  console.log('================================================================');
  console.log(' CHALLENGE 6: PATIENT CONTEXT, GOVERNED');
  console.log(' Governed Datapacks, Strict Access Separation & Medication Safety');
  console.log('================================================================\n');

  const cluster = new GovernedHealthcareCluster();
  await cluster.initializeDatapacks();
  console.log('[+] Initialized 3 Governed Meko Datapacks:');
  console.log('    - healthcare-clinical-datapack (Roles: clinical, physician)');
  console.log('    - healthcare-pharmacy-datapack (Roles: pharmacy, pharmacist, clinical)');
  console.log('    - healthcare-billing-datapack  (Roles: billing, finance)\n');

  // 1. Clinical Summary
  console.log('[Step 1: Clinical Summarizer]');
  const summary = await cluster.generateClinicalSummary();
  console.log(`  [+] Chart Summary: ${summary.summary}`);
  console.log(`  [!] Safety Alert:  ${summary.allergyAlert}\n`);

  // 2. Medication Reconciliation - Detecting Life-Threatening Conflict
  console.log('[Step 2: Medication Reconciliation & Conflict Interception]');
  console.log('  -> Doctor enters pending order: "Amoxicillin 500mg TID"');
  const rxRecon = await cluster.reconcilePrescriptionOrder('Amoxicillin 500mg TID');
  console.log(`  [${rxRecon.allowed ? '✓' : '✗'}] Order Status: ${rxRecon.allowed ? 'APPROVED' : 'BLOCKED & REJECTED'}`);
  console.log(`  [!] Conflict Details: ${rxRecon.conflictDetails}`);
  console.log(`  [#] Decision Trace: ${rxRecon.trace.reasoning}\n`);

  // 3. Access Separation & Boundary Proof
  console.log('[Step 3: Access Separation & Governance Verification]');
  const accessTest = await cluster.testAccessSeparation();
  console.log(`  [+] Billing Agent Access to Billing Datapack:   ${accessTest.billingCanSeeBillingDocs ? 'PERMITTED (Expected)' : 'DENIED'}`);
  console.log(`  [+] Billing Agent Access to Clinical Datapack:  ${accessTest.billingCanSeeClinicalNotes ? 'LEAKED (FAILURE)' : 'DENIED & BLOCKED (SECURE)'}`);
  console.log(`  [✓] Audit Log: ${accessTest.governanceAuditLog}\n`);

  return {
    summary,
    medicationCheck: rxRecon,
    governanceTest: accessTest
  };
}

if (import.meta.main) {
  runHealthcareChallenge().catch(console.error);
}
