import { KnowledgeDoc } from '../../types.ts';

export interface CustomerSegment {
  id: string;
  name: string;
  painPoints: string[];
  tonePreference: string;
  historicalResponseRate: number;
}

export const CUSTOMER_SEGMENTS: CustomerSegment[] = [
  {
    id: 'seg_enterprise_cto',
    name: 'Enterprise CTOs & VPs of Infrastructure',
    painPoints: ['SOC2/HIPAA compliance', '99.999% uptime', 'Preventing agent hallucinations', 'Multi-tenant data isolation'],
    tonePreference: 'Authoritative, security-first, data-backed',
    historicalResponseRate: 0.042
  },
  {
    id: 'seg_vpe_scaleup',
    name: 'Growth-Stage VPs of Engineering',
    painPoints: ['Developer context drift across Cursor & Claude', 'Token budget explosion', 'Onboarding velocity'],
    tonePreference: 'Pragmatic, developer-centric, metric-oriented',
    historicalResponseRate: 0.058
  },
  {
    id: 'seg_ai_founders',
    name: 'Early-Stage AI Founders & Builders',
    painPoints: ['Speed to prototype', 'Multi-agent coordination overhead', 'Affordable context engine'],
    tonePreference: 'Energetic, code-first, community-driven',
    historicalResponseRate: 0.081
  }
];

export const BRAND_KIT_DOCS: KnowledgeDoc[] = [
  {
    id: 'kb_brand_voice',
    title: 'Brand Voice & Guidelines: Meko Context Engine',
    category: 'marketing_guidelines',
    keywords: ['brand', 'voice', 'messaging', 'guidelines', 'tone'],
    content: `
# Brand Voice Principles
1. NEVER use generic buzzwords ("revolutionary", "game-changer", "magic").
2. ALWAYS lead with measurable engineering outcomes (e.g. "-80% tokens", "zero drift", "YugabyteDB reliability").
3. Include real code snippets or architectural proof in technical messaging.
4. Position Meko as the universal context engine connecting agents across IDEs and terminals.
`
  }
];
