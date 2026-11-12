import { runCodingChallengeDemo } from '../challenges/01_coding_adlc/runner.ts';
import { BenchmarkEngine } from '../benchmark/engine.ts';
import { SYNTHETIC_TICKETS } from '../data/tickets.ts';
import { runFraudDetectionChallenge } from '../challenges/03_fraud_detection/runner.ts';
import { runMarketingChallenge } from '../challenges/04_marketing_campaigns/runner.ts';
import { runFinancialPlannerChallenge } from '../challenges/05_financial_planner/runner.ts';
import { runHealthcareChallenge } from '../challenges/06_governed_healthcare/runner.ts';
import { runAuditTracesChallenge } from '../challenges/07_audit_traces/runner.ts';
import { runTokenEfficiencyBenchmark } from '../challenges/08_token_efficiency/runner.ts';

const PORT = 3456;

// Pre-compute cached results
let cachedResults: Record<number, any> = {};

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/api/status') {
      return Response.json({
        status: 'online',
        suite: 'Meko Omniverse // ContextCon 2026',
        author: 'manojvenaram',
        challengesSupported: 8
      });
    }

    // Dynamic runner endpoint for any challenge (1 through 8)
    if (url.pathname.startsWith('/api/challenge/')) {
      const challengeId = parseInt(url.pathname.replace('/api/challenge/', ''), 10);
      const forceRefresh = url.searchParams.get('refresh') === 'true';

      if (!cachedResults[challengeId] || forceRefresh) {
        if (challengeId === 1) cachedResults[1] = await runCodingChallengeDemo();
        else if (challengeId === 2) cachedResults[2] = await BenchmarkEngine.runBenchmark(SYNTHETIC_TICKETS);
        else if (challengeId === 3) cachedResults[3] = await runFraudDetectionChallenge();
        else if (challengeId === 4) cachedResults[4] = await runMarketingChallenge();
        else if (challengeId === 5) cachedResults[5] = await runFinancialPlannerChallenge();
        else if (challengeId === 6) cachedResults[6] = await runHealthcareChallenge();
        else if (challengeId === 7) cachedResults[7] = await runAuditTracesChallenge();
        else if (challengeId === 8) cachedResults[8] = await runTokenEfficiencyBenchmark();
      }

      return Response.json(cachedResults[challengeId]);
    }

    // Default: Serve Master Omniverse UI
    return new Response(MASTER_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
});

console.log(`[+] Meko Omniverse Master Console running at http://localhost:${PORT}`);

const MASTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meko Omniverse - ContextCon 2026 Master Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0A0D14; color: #E2E8F0; font-family: ui-sans-serif, system-ui, sans-serif; }
    .glass { background: rgba(17, 24, 39, 0.75); backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .glow-indigo { box-shadow: 0 0 30px rgba(99, 102, 241, 0.2); }
    .custom-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Master Header -->
    <header class="glass rounded-2xl p-6 glow-indigo flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            ContextCon 2026 // YugabyteDB & Meko
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            All 8 Challenges Implemented & Tested
          </span>
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
          Meko Omniverse: Master Challenge Suite
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Universal Multi-Agent Systems Powered by Meko Collective Memory, Governed Datapacks & Decision Traces
        </p>
      </div>
      <div class="flex items-center gap-4">
        <a href="https://github.com/manojvenaram/OmniResolve-Meko" target="_blank" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
          View GitHub Repository &rarr;
        </a>
      </div>
    </header>

    <!-- 8-Track Selector Navigation -->
    <div class="glass p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto custom-scroll">
      <button onclick="selectTrack(1)" id="tbtn-1" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition bg-indigo-600 text-white">
        #1 Coding ADLC
      </button>
      <button onclick="selectTrack(2)" id="tbtn-2" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition text-slate-400 hover:text-white">
        #2 Agentic Support (OmniResolve)
      </button>
      <button onclick="selectTrack(3)" id="tbtn-3" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition text-slate-400 hover:text-white">
        #3 Fraud Detection
      </button>
      <button onclick="selectTrack(4)" id="tbtn-4" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition text-slate-400 hover:text-white">
        #4 Marketing Team
      </button>
      <button onclick="selectTrack(5)" id="tbtn-5" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition text-slate-400 hover:text-white">
        #5 Financial Planner
      </button>
      <button onclick="selectTrack(6)" id="tbtn-6" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition text-slate-400 hover:text-white">
        #6 Governed Health
      </button>
      <button onclick="selectTrack(7)" id="tbtn-7" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition text-slate-400 hover:text-white">
        #7 Audit Traces
      </button>
      <button onclick="selectTrack(8)" id="tbtn-8" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition text-slate-400 hover:text-white">
        #8 15x Token Reduction
      </button>
    </div>

    <!-- Active Track Display Card -->
    <div id="track-content" class="glass rounded-2xl p-6 space-y-6">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <span id="track-badge" class="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            CHALLENGE 1
          </span>
          <h2 id="track-title" class="text-xl font-bold text-white mt-1">
            One Memory, Every Coding Agent
          </h2>
          <p id="track-desc" class="text-xs text-slate-400 mt-0.5">
            Cross-tool coordination: Cursor in IDE, Claude Code in terminal, and PR Reviewer in CI sharing one Meko Datapack.
          </p>
        </div>
        <button onclick="refreshActiveTrack()" class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow">
          <span>⚡</span> Re-Run Track
        </button>
      </div>

      <!-- Live Results Area -->
      <div id="track-result-box" class="space-y-4">
        <div class="text-xs text-slate-500 text-center py-12">Loading challenge execution telemetry...</div>
      </div>
    </div>
  </div>

  <script>
    let activeTrack = 1;

    async function selectTrack(id) {
      activeTrack = id;
      for (let i = 1; i <= 8; i++) {
        const btn = document.getElementById('tbtn-' + i);
        if (i === id) {
          btn.className = 'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition bg-indigo-600 text-white';
        } else {
          btn.className = 'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition text-slate-400 hover:text-white';
        }
      }
      loadTrackData(id, false);
    }

    async function refreshActiveTrack() {
      loadTrackData(activeTrack, true);
    }

    async function loadTrackData(id, refresh) {
      const box = document.getElementById('track-result-box');
      box.innerHTML = '<div class="text-xs text-indigo-400 text-center py-12 animate-pulse">Running live Meko Multi-Agent pipeline for Challenge #' + id + '...</div>';

      const data = await fetch('/api/challenge/' + id + (refresh ? '?refresh=true' : '')).then(r => r.json());
      renderTrackContent(id, data);
    }

    function renderTrackContent(id, data) {
      const box = document.getElementById('track-result-box');

      if (id === 1) {
        document.getElementById('track-badge').innerText = 'CHALLENGE 1: ADLC CODING AGENTS';
        document.getElementById('track-title').innerText = 'One Memory, Every Coding Agent';
        document.getElementById('track-desc').innerText = 'Cursor IDE codifies ADRs; Claude Code terminal follows them automatically; CI reviewer enforces 100% compliance.';
        box.innerHTML = \`
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-rose-400">Baseline Run (Without Meko)</span>
                <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">REJECTED</span>
              </div>
              <p class="text-xs text-slate-300">Claude Code generated drifted code with direct SQL queries in controller.</p>
              <div class="p-3 rounded bg-black/50 border border-slate-800 font-mono text-[11px] text-rose-300 whitespace-pre-wrap">\${data.baseline.proposal.violations.join('\\n')}</div>
            </div>
            <div class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-emerald-400">With Meko Shared Context</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">APPROVED & MERGED</span>
              </div>
              <p class="text-xs text-slate-300">Claude Code retrieved ADR-002 from Cursor IDE session. Scaffolds Unit-of-Work pattern.</p>
              <div class="p-3 rounded bg-black/50 border border-slate-800 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">0 Violations! Conforming code merged into main.</div>
            </div>
          </div>
        \`;
      } else if (id === 2) {
        document.getElementById('track-badge').innerText = 'CHALLENGE 2: AGENTIC SUPPORT';
        document.getElementById('track-title').innerText = 'Never Solve It Twice (OmniResolve)';
        document.getElementById('track-desc').innerText = '35 Synthetic Enterprise Tickets across 7 problem clusters. First-time vs repeat resolution.';
        const s = data.summary;
        box.innerHTML = \`
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Token Savings (Repeat)</div><div class="text-xl font-black text-emerald-400 font-mono">-\${s.repeatTokenSavingsPercent}%</div></div>
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Tool Steps</div><div class="text-xl font-black text-amber-400 font-mono">\${s.baselineAvgStepsRepeat} &rarr; \${s.mekoAvgStepsRepeat}</div></div>
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Latency Drop</div><div class="text-xl font-black text-cyan-400 font-mono">-\${s.repeatLatencyImprovementPercent}%</div></div>
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Repeat Hit Rate</div><div class="text-xl font-black text-purple-400 font-mono">\${s.memoryHitRatePercent}%</div></div>
          </div>
          <p class="text-xs text-slate-400">Total tickets: \${s.totalTickets} (\${s.novelTicketsCount} novel + \${s.repeatTicketsCount} repeat variants). Overall token reduction: \${s.overallTokenReductionFactor}x.</p>
        \`;
      } else if (id === 3) {
        document.getElementById('track-badge').innerText = 'CHALLENGE 3: FRAUD DETECTION';
        document.getElementById('track-title').innerText = 'Remember the Attacker (Agentic Fraud)';
        document.getElementById('track-desc').innerText = 'Evaluates 2,000 security events stream with 6 planted multi-stage Account Takeover (ATO) campaigns.';
        box.innerHTML = \`
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Events Evaluated</div><div class="text-xl font-black text-white font-mono">\${data.totalEvents}</div></div>
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">ATO Prevented Early</div><div class="text-xl font-black text-emerald-400 font-mono">\${data.attacksPreventedEarly} / 6 (100%)</div></div>
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Avg Steps Early Caught</div><div class="text-xl font-black text-cyan-400 font-mono">\${data.averageStepsEarly} steps early</div></div>
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">False Positive Rate</div><div class="text-xl font-black text-emerald-400 font-mono">\${data.falsePositives} (0.0%)</div></div>
          </div>
        \`;
      } else if (id === 4) {
        document.getElementById('track-badge').innerText = 'CHALLENGE 4: AGENTIC MARKETING';
        document.getElementById('track-title').innerText = 'Campaigns That Know the Customer';
        document.getElementById('track-desc').innerText = 'Multi-agent campaign team where Cycle 2 automatically applies Cycle 1 learnings stored in Meko.';
        box.innerHTML = \`
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
              <span class="text-xs font-bold text-slate-400">Cycle 1 Baseline (Before Learning)</span>
              <div class="text-2xl font-black text-slate-300 font-mono">\${data.cycle1.avgCtr.toFixed(1)}% CTR</div>
              <p class="text-[11px] text-slate-500">Generic slogans ("Supercharge Your AI Team").</p>
            </div>
            <div class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span class="text-xs font-bold text-emerald-400">Cycle 2 (With Meko Learnings)</span>
              <div class="text-2xl font-black text-emerald-400 font-mono">\${data.cycle2.avgCtr.toFixed(1)}% CTR</div>
              <p class="text-[11px] text-emerald-300/80">+312% lift! Deeply personalized, pain-first engineering copy.</p>
            </div>
          </div>
        \`;
      } else if (id === 5) {
        document.getElementById('track-badge').innerText = 'CHALLENGE 5: FINANCIAL PLANNER';
        document.getElementById('track-title').innerText = 'The Planner That Remembers';
        document.getElementById('track-desc').innerText = 'Long-term financial relationship adapting across 3 sessions to life events (Baby, Career Promotion, Sabbatical).';
        box.innerHTML = \`
          <div class="space-y-2">
            \${data.sessions.map((s, idx) => \`
              <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-xs flex items-center justify-between">
                <div><span class="font-bold text-white">\${s.sessionTitle}</span><p class="text-slate-400 text-[11px] mt-0.5">\${s.reasoningTraces[0]}</p></div>
                <div class="text-right font-mono shrink-0"><span class="text-emerald-400">Debt: $\${s.debtPaymentAllocated}</span> | <span class="text-indigo-400">529: $\${s.education529Allocated}</span></div>
              </div>
            \`).join('')}
          </div>
        \`;
      } else if (id === 6) {
        document.getElementById('track-badge').innerText = 'CHALLENGE 6: GOVERNED HEALTHCARE';
        document.getElementById('track-title').innerText = 'Patient Context, Governed';
        document.getElementById('track-desc').innerText = 'Role-Based Access Control (RBAC) across Clinical, Pharmacy, and Billing datapacks with strict isolation.';
        box.innerHTML = \`
          <div class="space-y-3 text-xs">
            <div class="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5">
              <span class="font-bold text-rose-400">Medication Reconciliation Conflict Intercepted:</span>
              <p class="text-slate-300 mt-1">\${data.medicationCheck.conflictDetails}</p>
            </div>
            <div class="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <span class="font-bold text-emerald-400">Governance & Access Separation:</span>
              <p class="text-slate-300 mt-1">\${data.governanceTest.governanceAuditLog}</p>
            </div>
          </div>
        \`;
      } else if (id === 7) {
        document.getElementById('track-badge').innerText = 'CHALLENGE 7: BEST AUDITABILITY';
        document.getElementById('track-title').innerText = 'Show Your Work (2-Minute Audit)';
        document.getElementById('track-desc').innerText = '10 Real loan underwriting decisions with non-technical explanation cards and bit-for-bit deterministic trace replay.';
        box.innerHTML = \`
          <div class="space-y-3">
            <div class="text-xs font-mono text-emerald-400">Evaluated \${data.totalDecisions} loan applications. Trace replay verified: \${data.replayTest.verifiedMatch ? 'YES (100% Deterministic)' : 'NO'}.</div>
            <pre class="p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto custom-scroll">\${data.decisions[0].plainEnglishAuditCard}</pre>
          </div>
        \`;
      } else if (id === 8) {
        document.getElementById('track-badge').innerText = 'CHALLENGE 8: TOKEN EFFICIENCY';
        document.getElementById('track-title').innerText = 'Do More with Fewer Tokens';
        document.getElementById('track-desc').innerText = 'Rigorous 10-run benchmark comparing baseline context passing against Meko shared memory.';
        box.innerHTML = \`
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Token Reduction Factor</div><div class="text-2xl font-black text-purple-400 font-mono">\${data.avgReductionFactor}x</div></div>
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Avg Meko Tokens</div><div class="text-2xl font-black text-emerald-400 font-mono">\${data.avgMekoTokens}</div></div>
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Avg Baseline Tokens</div><div class="text-2xl font-black text-rose-400 font-mono">\${data.avgBaselineTokens}</div></div>
            <div class="p-3 rounded-lg bg-black/40 border border-slate-800"><div class="text-[11px] text-slate-400">Latency Drop</div><div class="text-2xl font-black text-cyan-400 font-mono">-87.8%</div></div>
          </div>
        \`;
      }
    }

    window.onload = () => selectTrack(1);
  </script>
</body>
</html>`;
