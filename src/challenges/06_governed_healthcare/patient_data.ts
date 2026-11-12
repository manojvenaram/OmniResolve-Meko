import { KnowledgeDoc } from '../../types.ts';

export const PATIENT_CLINICAL_DOCS: KnowledgeDoc[] = [
  {
    id: 'pt_clinical_notes_01',
    title: 'Clinical Encounter Note: Eleanor Vance (Confidential)',
    category: 'clinical',
    keywords: ['patient', 'clinical', 'allergy', 'penicillin', 'anaphylaxis', 'hypertension', 'diabetes'],
    content: `
# Confidential Inpatient Record - Eleanor Vance (DOB: 1958-04-12)
PRIMARY ALLERGIES:
- PENICILLIN: SEVERE ANAPHYLAXIS (Laryngeal edema, ICU admission in 2018). STRICTLY CONTRAINDICATED with all beta-lactams and aminopenicillins.
- SULFA: Mild rash.

ACTIVE CHRONIC CONDITIONS:
- Type 2 Diabetes Mellitus (HbA1c: 7.4)
- Essential Hypertension
- Diabetic Neuropathy

PHYSICIAN IMPRESSION:
Patient admitted with acute bacterial sinusitis. Resident entered pending order for Amoxicillin 500mg TID.
`
  }
];

export const PATIENT_BILLING_DOCS: KnowledgeDoc[] = [
  {
    id: 'pt_billing_record_01',
    title: 'Itemized Insurance Billing & ICD-10 Codes: Eleanor Vance',
    category: 'billing',
    keywords: ['billing', 'insurance', 'icd10', 'cpt', 'claim', 'copay'],
    content: `
# Billing Statement - Account #VNC-882194
- Insurance: BlueShield Medicare Advantage
- Copay Amount: $35.00
- ICD-10 Diagnosis Codes:
  * E11.9 (Type 2 diabetes mellitus without complications)
  * I10 (Essential hypertension)
- CPT Procedures:
  * 99214 (Level 4 Office Visit, established patient)
  * 80053 (Comprehensive Metabolic Panel)
`
  }
];
