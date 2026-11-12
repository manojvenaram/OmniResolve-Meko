import { SYNTHETIC_TICKETS } from '../data/tickets.ts';
import { BenchmarkEngine } from '../benchmark/engine.ts';
import { MekoClient } from '../meko/client.ts';
import { TriageAgent } from '../agents/triage_agent.ts';
import { SpecialistAgent } from '../agents/specialist_agent.ts';
import { HitlPromoter } from '../agents/hitl_promoter.ts';
import { ENTERPRISE_KNOWLEDGE_BASE } from '../knowledge/index.ts';

const PORT = 3456;

// Shared live Meko instance
const liveMekoClient = new MekoClient({ datapackId: 'omni-resolve-live-datapack' });
await liveMekoClient.batchIngestKnowledgeDocs(ENTERPRISE_KNOWLEDGE_BASE);
const liveTriage = new TriageAgent(liveMekoClient);
const liveSpecialist = new SpecialistAgent(liveMekoClient);
const liveHitl = new HitlPromoter(liveMekoClient);

// Pre-compute cached benchmark
let cachedBenchmark: any = null;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve API endpoints
    if (url.pathname === '/api/status') {
      return Response.json({
        status: 'online',
        server: 'OmniResolve // ContextCon 2026',
        datapackId: liveMekoClient.getDatapackId(),
        memoriesCount: (await liveMekoClient.listAllMemories()).length,
        tracesCount: liveMekoClient.getAllTraces().length
      });
    }

    if (url.pathname === '/api/tickets') {
      return Response.json({ tickets: SYNTHETIC_TICKETS });
    }

    if (url.pathname === '/api/memories') {
      const memories = await liveMekoClient.listAllMemories();
      return Response.json({ memories });
    }

    if (url.pathname === '/api/benchmark') {
      if (!cachedBenchmark || url.searchParams.get('refresh') === 'true') {
        cachedBenchmark = await BenchmarkEngine.runBenchmark(SYNTHETIC_TICKETS);
      }
      return Response.json(cachedBenchmark);
    }

    if (url.pathname.startsWith('/api/resolve/')) {
      const ticketId = url.pathname.replace('/api/resolve/', '');
      const ticket = SYNTHETIC_TICKETS.find(t => t.id === ticketId);
      if (!ticket) {
        return new Response('Ticket not found', { status: 404 });
      }

      const triageRes = await liveTriage.evaluateTicket(ticket);
      let resolution: any;

      if (triageRes.hit && triageRes.resolution) {
        resolution = triageRes.resolution;
      } else {
        resolution = await liveSpecialist.diagnoseAndSolve(ticket, triageRes.searchTrace);
        await liveHitl.reviewAndPromote(ticket, resolution, true);
      }

      return Response.json({ resolution });
    }

    // Default: Serve complete interactive single-page app
    return new Response(INDEX_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
});

console.log(`[+] OmniResolve Web Dashboard running at http://localhost:${PORT}`);

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OmniResolve Console - ContextCon 2026</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0B0F19; color: #E2E8F0; font-family: ui-sans-serif, system-ui, sans-serif; }
    .glass { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .glow-indigo { box-shadow: 0 0 25px rgba(99, 102, 241, 0.25); }
    .custom-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <header class="glass rounded-2xl p-6 glow-indigo flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            ContextCon 2026 // Yugabyte & Meko
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Challenge 2: Agentic Support
          </span>
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
          OmniResolve: Never Solve It Twice
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Autonomous Multi-Agent Support Pipeline Powered by Meko Collective Memory, Hybrid Vector Retrieval & Decision Traces
        </p>
      </div>
      <div class="flex items-center gap-4">
        <button onclick="runLiveBenchmark()" id="btn-bench" class="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition shadow-lg shadow-indigo-500/25 flex items-center gap-2">
          <span>⚡</span> Re-Run Full Benchmark (35 Tickets)
        </button>
      </div>
    </header>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass p-4 rounded-xl">
        <div class="text-xs text-slate-400 font-medium">Token Savings (Repeat)</div>
        <div id="metric-token-savings" class="text-2xl font-black text-emerald-400 mt-1">-80.2%</div>
        <div class="text-[11px] text-slate-500 mt-0.5">5,100 &rarr; 1,011 tokens</div>
      </div>
      <div class="glass p-4 rounded-xl">
        <div class="text-xs text-slate-400 font-medium">Memory Hit Rate</div>
        <div id="metric-hit-rate" class="text-2xl font-black text-indigo-400 mt-1">96.4%</div>
        <div class="text-[11px] text-slate-500 mt-0.5">27 / 28 repeat tickets</div>
      </div>
      <div class="glass p-4 rounded-xl">
        <div class="text-xs text-slate-400 font-medium">Tool Steps Reduction</div>
        <div id="metric-steps" class="text-2xl font-black text-amber-400 mt-1">4 &rarr; 1.1</div>
        <div class="text-[11px] text-slate-500 mt-0.5">-72.5% fewer tool turns</div>
      </div>
      <div class="glass p-4 rounded-xl">
        <div class="text-xs text-slate-400 font-medium">Resolution Latency</div>
        <div id="metric-latency" class="text-2xl font-black text-cyan-400 mt-1">-83.5%</div>
        <div class="text-[11px] text-slate-500 mt-0.5">3.1s &rarr; 0.4s on repeats</div>
      </div>
      <div class="glass p-4 rounded-xl col-span-2 md:col-span-1">
        <div class="text-xs text-slate-400 font-medium">Total Token Reduction</div>
        <div id="metric-reduction-factor" class="text-2xl font-black text-purple-400 mt-1">2.79x</div>
        <div class="text-[11px] text-slate-500 mt-0.5">Across entire dataset</div>
      </div>
    </div>

    <!-- Main Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left: Ticket Stream (5 cols) -->
      <div class="lg:col-span-5 glass rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 class="text-base font-bold text-white">Synthetic Ticket Queue (35)</h2>
            <p class="text-xs text-slate-400">Click any ticket to inspect Meko traces</p>
          </div>
          <div class="flex gap-1">
            <button onclick="filterTickets('all')" class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-200 hover:bg-slate-700">All</button>
            <button onclick="filterTickets('novel')" class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-200 hover:bg-slate-700">Novel (7)</button>
            <button onclick="filterTickets('repeat')" class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-200 hover:bg-slate-700">Repeat (28)</button>
          </div>
        </div>

        <div id="ticket-list" class="space-y-2.5 max-h-[640px] overflow-y-auto custom-scroll pr-1">
          <div class="text-xs text-slate-500 text-center py-8">Loading tickets...</div>
        </div>
      </div>

      <!-- Right: Live Inspection & Decision Trace (7 cols) -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Ticket Resolution Card -->
        <div class="glass rounded-2xl p-6 space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <span id="inspect-badge" class="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                SELECT A TICKET
              </span>
              <h3 id="inspect-title" class="text-lg font-bold text-white mt-2">
                Click any ticket on the left to see Meko in action
              </h3>
              <p id="inspect-meta" class="text-xs text-slate-400 mt-1"></p>
            </div>
            <div id="inspect-stats" class="text-right shrink-0"></div>
          </div>

          <div id="inspect-body" class="space-y-3 pt-3 border-t border-slate-800 text-xs">
            <p class="text-slate-400 italic">No ticket selected yet.</p>
          </div>
        </div>

        <!-- Meko Decision Traces Timeline -->
        <div class="glass rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 class="text-base font-bold text-white">Meko Decision Trace Audit Trail</h3>
            </div>
            <span class="text-xs font-mono text-slate-400">Meko Datapack: omni-resolve</span>
          </div>

          <div id="trace-container" class="space-y-3 max-h-[350px] overflow-y-auto custom-scroll pr-1">
            <div class="text-xs text-slate-500 text-center py-6">Select a ticket above to inspect its granular agent turns, retrievals, and token consumption.</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let tickets = [];
    let benchmarkData = null;
    let selectedTicketId = null;
    let currentFilter = 'all';

    async function loadData() {
      const [ticketsRes, benchRes] = await Promise.all([
        fetch('/api/tickets').then(r => r.json()),
        fetch('/api/benchmark').then(r => r.json())
      ]);
      tickets = ticketsRes.tickets;
      benchmarkData = benchRes;
      updateMetrics();
      renderTickets();
      if (tickets.length > 0) {
        selectTicket(tickets[0].id);
      }
    }

    function updateMetrics() {
      if (!benchmarkData?.summary) return;
      const s = benchmarkData.summary;
      document.getElementById('metric-token-savings').innerText = '-' + s.repeatTokenSavingsPercent + '%';
      document.getElementById('metric-hit-rate').innerText = s.memoryHitRatePercent + '%';
      document.getElementById('metric-steps').innerText = s.baselineAvgStepsRepeat + ' → ' + s.mekoAvgStepsRepeat;
      document.getElementById('metric-latency').innerText = '-' + s.repeatLatencyImprovementPercent + '%';
      document.getElementById('metric-reduction-factor').innerText = s.overallTokenReductionFactor + 'x';
    }

    function filterTickets(type) {
      currentFilter = type;
      renderTickets();
    }

    function renderTickets() {
      const container = document.getElementById('ticket-list');
      let filtered = tickets;
      if (currentFilter === 'novel') filtered = tickets.filter(t => !t.isRepeat);
      if (currentFilter === 'repeat') filtered = tickets.filter(t => t.isRepeat);

      container.innerHTML = filtered.map(t => {
        const metric = benchmarkData?.metrics?.find(m => m.ticketId === t.id);
        const isSelected = t.id === selectedTicketId;
        const borderClass = isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50';
        const badgeColor = t.isRepeat ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        const badgeText = t.isRepeat ? 'REPEAT VARIANT' : 'NOVEL (FIRST)';
        const savingsText = metric?.tokenSavingsPercent > 0 ? ('-' + metric.tokenSavingsPercent + '% tokens') : 'Baseline';

        return \`
          <div onclick="selectTicket('\${t.id}')" class="p-3.5 rounded-xl border \${borderClass} cursor-pointer transition space-y-2">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border \${badgeColor}">\${badgeText}</span>
              <span class="font-mono text-[11px] \${metric?.tokenSavingsPercent > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}">\${savingsText}</span>
            </div>
            <div class="font-semibold text-xs text-white line-clamp-1">\${t.title}</div>
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>\${t.customerName} (\${t.category})</span>
              <span class="font-mono text-slate-500">\${t.id}</span>
            </div>
          </div>
        \`;
      }).join('');
    }

    async function selectTicket(id) {
      selectedTicketId = id;
      renderTickets();
      const ticket = tickets.find(t => t.id === id);
      const resData = await fetch('/api/resolve/' + id).then(r => r.json());
      const res = resData.resolution;
      const metric = benchmarkData?.metrics?.find(m => m.ticketId === id);

      // Render Inspection Card
      document.getElementById('inspect-badge').innerText = res.isMemoryHit ? 'RESOLVED VIA MEKO COLLECTIVE MEMORY (1 TURN)' : 'RESOLVED VIA SPECIALIST AGENT + HITL PROMOTION';
      document.getElementById('inspect-badge').className = res.isMemoryHit 
        ? 'px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        : 'px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30';

      document.getElementById('inspect-title').innerText = ticket.title;
      document.getElementById('inspect-meta').innerText = ticket.customerName + ' • ' + ticket.environment + ' • Severity: ' + ticket.severity.toUpperCase();

      document.getElementById('inspect-stats').innerHTML = \`
        <div class="text-xs text-slate-400">Tokens: <span class="font-bold font-mono text-white">\${res.totalTokens}</span></div>
        <div class="text-xs text-slate-400">Latency: <span class="font-bold font-mono text-emerald-400">\${res.totalLatencyMs}ms</span></div>
        <div class="text-xs text-slate-400">Steps: <span class="font-bold font-mono text-amber-400">\${res.toolStepsCount} step</span></div>
      \`;

      let bodyHtml = \`
        <div>
          <span class="font-bold text-slate-300">Customer Description:</span>
          <p class="text-slate-400 mt-0.5">\${ticket.description}</p>
        </div>
        \${ticket.errorLogs ? \`
        <div>
          <span class="font-bold text-rose-400">Error Signature:</span>
          <div class="mt-0.5 p-2 rounded bg-black/50 border border-slate-800 font-mono text-[11px] text-rose-300 overflow-x-auto">\${ticket.errorLogs}</div>
        </div>\` : ''}
        <div>
          <span class="font-bold text-emerald-400">Verified Root Cause:</span>
          <p class="text-slate-300 mt-0.5">\${res.rootCause}</p>
        </div>
        <div>
          <span class="font-bold text-indigo-400">Remediation Steps:</span>
          <ul class="list-disc list-inside text-slate-400 mt-1 space-y-1">
            \${res.resolutionSteps.map(s => '<li>' + s + '</li>').join('')}
          </ul>
        </div>
        \${res.codePatch ? \`
        <div>
          <span class="font-bold text-amber-400">Verified Code Remediation Patch:</span>
          <pre class="mt-1 p-3 rounded bg-black/60 border border-slate-800 font-mono text-[11px] text-amber-200 overflow-x-auto custom-scroll">\${res.codePatch}</pre>
        </div>\` : ''}
      \`;
      document.getElementById('inspect-body').innerHTML = bodyHtml;

      // Render Decision Traces
      const traceContainer = document.getElementById('trace-container');
      traceContainer.innerHTML = res.traces.map((trace, idx) => {
        return \`
          <div class="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold font-mono text-indigo-400">Turn #\${idx + 1}: \${trace.agentName} [\${trace.action}]</span>
              <span class="font-mono text-slate-400">\${trace.tokenUsage.totalTokens} tokens • \${trace.latencyMs}ms</span>
            </div>
            <div class="text-xs text-slate-300 font-medium">\${trace.inputSummary}</div>
            <div class="p-2 rounded bg-black/40 border border-slate-800 text-[11px] text-slate-400 italic">
              \${trace.reasoning}
            </div>
            <div class="text-[11px] text-emerald-400 font-medium">Outcome: \${trace.outputSummary}</div>
          </div>
        \`;
      }).join('');
    }

    async function runLiveBenchmark() {
      const btn = document.getElementById('btn-bench');
      btn.innerText = '⏳ Running Benchmark Across 35 Tickets...';
      btn.disabled = true;
      benchmarkData = await fetch('/api/benchmark?refresh=true').then(r => r.json());
      updateMetrics();
      renderTickets();
      if (selectedTicketId) selectTicket(selectedTicketId);
      btn.innerText = '⚡ Re-Run Full Benchmark (35 Tickets)';
      btn.disabled = false;
    }

    window.onload = loadData;
  </script>
</body>
</html>`;

