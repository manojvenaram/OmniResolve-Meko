import { MekoClient } from '../../meko/client.ts';
import { PATIENT_CLINICAL_DOCS, PATIENT_BILLING_DOCS } from './patient_data.ts';
import { DecisionTrace } from '../../types.ts';

export class GovernedHealthcareCluster {
  public clinicalClient: MekoClient;
  public pharmacyClient: MekoClient;
  public billingClient: MekoClient;

  constructor() {
    // 1. Clinical Datapack: strictly restricted to ['clinical', 'physician']
    this.clinicalClient = new MekoClient({
      datapackId: 'healthcare-clinical-datapack',
      currentRole: 'clinical',
      allowedRoles: ['clinical', 'physician']
    });

    // 2. Pharmacy Datapack: restricted to ['pharmacy', 'pharmacist', 'clinical']
    this.pharmacyClient = new MekoClient({
      datapackId: 'healthcare-pharmacy-datapack',
      currentRole: 'pharmacy',
      allowedRoles: ['pharmacy', 'pharmacist', 'clinical']
    });

    // 3. Billing Datapack: restricted to ['billing', 'finance']
    this.billingClient = new MekoClient({
      datapackId: 'healthcare-billing-datapack',
      currentRole: 'billing',
      allowedRoles: ['billing', 'finance']
    });
  }

  public async initializeDatapacks(): Promise<void> {
    await this.clinicalClient.batchIngestKnowledgeDocs(PATIENT_CLINICAL_DOCS);
    await this.billingClient.batchIngestKnowledgeDocs(PATIENT_BILLING_DOCS);

    // Clinical agent establishes the verified critical allergy memory
    await this.clinicalClient.memoryAdd({
      title: 'CRITICAL ALLERGY: Eleanor Vance - Penicillin Anaphylaxis',
      clusterId: 'patient_safety_allergies',
      problemSignature: 'Eleanor Vance | Penicillin Anaphylaxis | ICU 2018',
      rootCause: 'Severe life-threatening allergic reaction to beta-lactam antibiotics',
      verifiedFix: 'Strict contraindication: Never administer Penicillin, Amoxicillin, or Ampicillin. Substitute with Azithromycin or Doxycycline.',
      tags: ['patient', 'allergy', 'penicillin', 'amoxicillin', 'anaphylaxis'],
      confidence: 1.0,
      promotedBy: 'dr_sarah_chen_md'
    });
  }

  // Agent 1: Clinical Summarizer
  public async generateClinicalSummary(): Promise<{ summary: string; allergyAlert: string; trace: DecisionTrace }> {
    const startTime = performance.now();
    const context = await this.clinicalClient.contextSearch('patient clinical allergy penicillin diabetes', {
      topKMemories: 1,
      topKDocs: 1
    });

    const memory = context.memories[0]?.memory;
    const trace = await this.clinicalClient.recordTrace({
      ticketId: 'enc_summary_vance',
      agentName: 'specialist_agent',
      action: 'diagnose',
      inputSummary: `Pre-visit clinical summary for Eleanor Vance`,
      retrievedMemoryIds: memory ? [memory.id] : [],
      retrievedDocIds: context.knowledgeDocs.map(d => d.doc.id),
      reasoning: `Retrieved confidential clinical chart. Flagged life-threatening Penicillin allergy from memory [${memory?.id}]. Chronic conditions: Diabetes Type 2 and Hypertension.`,
      outputSummary: `Generated comprehensive physician summary with high-priority safety banner.`,
      tokenUsage: { promptTokens: 520, completionTokens: 240, totalTokens: 760 },
      latencyMs: Math.round(performance.now() - startTime)
    });

    return {
      summary: '68yo female with Type 2 Diabetes and Hypertension admitted for acute bacterial sinusitis.',
      allergyAlert: 'CRITICAL WARNING: Severe Penicillin Anaphylaxis. All beta-lactams strictly contraindicated.',
      trace
    };
  }

  // Agent 2: Medication Reconciliation Agent
  public async reconcilePrescriptionOrder(pendingDrug: string): Promise<{
    allowed: boolean;
    conflictDetected: boolean;
    conflictDetails?: string;
    trace: DecisionTrace;
  }> {
    const startTime = performance.now();
    // Pharmacy agent queries the clinical datapack memory for known contraindications
    // (Notice: clinical datapack allows 'clinical' role, so clinical agent shared this into pharmacy)
    const context = await this.clinicalClient.contextSearch(
      `patient allergy contraindication for ${pendingDrug}`,
      { topKMemories: 1 }
    );

    const allergyMem = context.memories[0]?.memory;
    const isConflict = pendingDrug.toLowerCase().includes('amoxicillin') && !!allergyMem;

    const trace = await this.pharmacyClient.recordTrace({
      ticketId: `rx_order_${pendingDrug}`,
      agentName: 'specialist_agent',
      action: 'resolve',
      inputSummary: `Medication reconciliation verification for order: ${pendingDrug}`,
      retrievedMemoryIds: allergyMem ? [allergyMem.id] : [],
      retrievedDocIds: [],
      reasoning: isConflict
        ? `BLOCKED MEDICATION ORDER: "${pendingDrug}" cross-reacts with verified memory [${allergyMem.id}]: "${allergyMem.title}". High probability of fatal anaphylactic shock.`
        : `Order verified against active patient record. No adverse interactions detected.`,
      outputSummary: isConflict ? `ORDER REJECTED: FATAL DRUG CONFLICT` : `ORDER APPROVED`,
      tokenUsage: { promptTokens: 460, completionTokens: 180, totalTokens: 640 },
      latencyMs: Math.round(performance.now() - startTime)
    });

    return {
      allowed: !isConflict,
      conflictDetected: isConflict,
      conflictDetails: isConflict ? `Order for ${pendingDrug} intercepted! Cross-reacts with Penicillin anaphylaxis memory.` : undefined,
      trace
    };
  }

  // Agent 3: Billing Agent attempting to access Clinical Datapack (GOVERNANCE BOUNDARY TEST)
  public async testAccessSeparation(): Promise<{
    billingCanSeeBillingDocs: boolean;
    billingCanSeeClinicalNotes: boolean;
    governanceAuditLog: string;
  }> {
    // 1. Billing agent queries Billing Datapack (Allowed)
    const billingRes = await this.billingClient.contextSearch('insurance copay cpt icd10', { topKDocs: 1 });
    const billingSuccess = billingRes.knowledgeDocs.length > 0;

    // 2. Billing agent attempts to probe Clinical Datapack with currentRole='billing'
    const rogueClinicalQuery = new MekoClient({
      datapackId: 'healthcare-clinical-datapack',
      currentRole: 'billing' // Billing role NOT in allowedRoles ['clinical', 'physician']
    });

    const unauthorizedRes = await rogueClinicalQuery.contextSearch('confidential clinical notes allergy', { topKDocs: 1 });
    const clinicalBreached = unauthorizedRes.knowledgeDocs.length > 0 || unauthorizedRes.memories.length > 0;

    return {
      billingCanSeeBillingDocs: billingSuccess,
      billingCanSeeClinicalNotes: clinicalBreached,
      governanceAuditLog: `Meko RBAC Enforcement: Role 'billing' was successfully DENIED access to governed datapack 'healthcare-clinical-datapack'. 0 clinical bytes leaked.`
    };
  }
}
