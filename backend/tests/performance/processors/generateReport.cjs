"use strict";

const fs = require("fs");
const path = require("path");

const target = (process.env.PERF_DB_TARGET || "").toLowerCase();
const baseName =
process.env.REPORT_BASENAME ||
(target === "docker" ? "docker_report" : target === "atlas" ? "atlas_report" : "report");

const reportJsonPath = path.join(__dirname, `../reports/${baseName}.json`);
const reportHtmlPath = path.join(__dirname, `../reports/${baseName}.html`);

if (!fs.existsSync(reportJsonPath)) {
  console.error(`${baseName}.json not found. Run perf:run first.`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(reportJsonPath, "utf8"));
const agg = raw.aggregate;
const intermediate = raw.intermediate || [];

// ── Helpers ────────────────────────────────────────────────────────────────

function counterVal(obj, key) {
  return obj?.counters?.[key] || 0;
}

function histVal(obj, key, stat) {
  return (
    obj?.histograms?.[key]?.[stat] ?? obj?.summaries?.[key]?.[stat] ?? null
  );
}

function fmtMs(val) {
  if (val === null || val === undefined) return "—";
  return `${Math.round(val)} ms`;
}

function fmtNum(val) {
  if (val === null || val === undefined) return "—";
  return Number(val).toLocaleString();
}

// ── SVG Icon helpers ───────────────────────────────────────────────────────

const ICON_CHECK = `<svg class="icon icon-check" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.25" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 8.25L6.75 10.5L11.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_CROSS = `<svg class="icon icon-cross" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.25" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const ICON_WARN = `<svg class="icon icon-warn" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2L14.5 13.25H1.5L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6.5V9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/></svg>`;

// ── Aggregate counters ─────────────────────────────────────────────────────

const totalCreated = counterVal(agg, "vusers.created");
const totalFailed = counterVal(agg, "vusers.failed");
const totalCompleted = counterVal(agg, "vusers.completed");
const totalRequests = counterVal(agg, "http.requests");

const total2xx =
  counterVal(agg, "http.codes.200") +
  counterVal(agg, "http.codes.201") +
  counterVal(agg, "http.codes.204");
const total4xx = ["400", "401", "403", "404", "409", "422"].reduce(
  (s, c) => s + counterVal(agg, `http.codes.${c}`),
  0,
);
const total5xx = ["500", "502", "503", "504"].reduce(
  (s, c) => s + counterVal(agg, `http.codes.${c}`),
  0,
);

const successRate =
  totalCreated > 0
    ? (((totalCreated - totalFailed) / totalCreated) * 100).toFixed(1)
    : "0.0";

const p50 = histVal(agg, "http.response_time", "p50");
const p95 = histVal(agg, "http.response_time", "p95");
const p99 = histVal(agg, "http.response_time", "p99");
const pMax = histVal(agg, "http.response_time", "max");
const pMin = histVal(agg, "http.response_time", "min");

// ── Scenario breakdown ─────────────────────────────────────────────────────

const scenarioNames = Object.keys(agg.counters || {})
  .filter((k) => k.startsWith("vusers.created_by_name."))
  .map((k) => k.replace("vusers.created_by_name.", ""));

const scenarioRows = scenarioNames
  .map((name) => {
    const created = counterVal(agg, `vusers.created_by_name.${name}`);
    const pct =
      totalCreated > 0 ? ((created / totalCreated) * 100).toFixed(1) : "0";
    return `<tr><td>${name}</td><td class="num">${fmtNum(created)}</td><td class="num">${pct}%</td></tr>`;
  })
  .join("");

// ── HTTP status code breakdown ─────────────────────────────────────────────

const allCodes = Object.keys(agg.counters || {})
  .filter((k) => k.startsWith("http.codes."))
  .map((k) => ({ code: k.replace("http.codes.", ""), count: agg.counters[k] }))
  .sort((a, b) => a.code - b.code);

const codeRows =
  allCodes
    .map(({ code, count }) => {
      const cls = code.startsWith("2")
        ? "success"
        : code.startsWith("4")
          ? "warn"
          : code.startsWith("5")
            ? "danger"
            : "";
      return `<tr class="${cls}"><td>${code}</td><td class="num">${fmtNum(count)}</td></tr>`;
    })
    .join("") || '<tr><td colspan="2">No HTTP response data recorded</td></tr>';

// ── Timeline data for chart ────────────────────────────────────────────────

const timelineLabels = intermediate.map((_, i) => `T+${i * 10}s`);
const timelineCreated = intermediate.map((p) =>
  counterVal(p, "vusers.created"),
);
const timelineFailed = intermediate.map((p) => counterVal(p, "vusers.failed"));
const timelineP95 = intermediate.map(
  (p) => histVal(p, "http.response_time", "p95") ?? 0,
);

// ── Error breakdown ────────────────────────────────────────────────────────

const errorEntries = Object.entries(agg.counters || {})
  .filter(([k]) => k.startsWith("errors."))
  .map(([k, v]) => ({ name: k.replace("errors.", ""), count: v }));

const errorRows =
  errorEntries.length > 0
    ? errorEntries
        .map(
          (e) =>
            `<tr class="danger"><td>${e.name}</td><td class="num">${fmtNum(e.count)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="2" class="no-errors">${ICON_CHECK} No errors recorded</td></tr>`;

// ── Overall status ─────────────────────────────────────────────────────────

const p95Threshold = 2000;
const p99Threshold = 5000;
const p95Pass = p95 !== null && p95 <= p95Threshold;
const p99Pass = p99 !== null && p99 <= p99Threshold;
const overallPass = totalFailed === 0 && p95Pass && p99Pass;
const allFailed = totalFailed === totalCreated && totalCreated > 0;

const badgeClass = allFailed ? "fail" : overallPass ? "pass" : "warn";
const badgeIcon = allFailed ? ICON_CROSS : overallPass ? ICON_CHECK : ICON_WARN;
const badgeText = allFailed
  ? "All tests failed — check errors below"
  : overallPass
    ? "All thresholds passed"
    : "Some thresholds not met";

const p95Chip = `<span class="threshold-chip ${p95Pass ? "chip-pass" : "chip-fail"}">${p95Pass ? ICON_CHECK : ICON_CROSS}</span>`;
const p99Chip = `<span class="threshold-chip ${p99Pass ? "chip-pass" : "chip-fail"}">${p99Pass ? ICON_CHECK : ICON_CROSS}</span>`;

const thresholdResult = (pass) =>
  `<span class="result-pill ${pass ? "pill-pass" : "pill-fail"}">${pass ? ICON_CHECK : ICON_CROSS}${pass ? "Pass" : "Fail"}</span>`;

// ── HTML ───────────────────────────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>MoneyMentor — Performance Report</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  :root {
    --bg-main: #131314; --bg-card: #1e1f22; --border-color: #444746;
    --text-main: #e3e3e3; --text-muted: #c4c7c5;
    --color-success: #6dd68c; --color-success-bg: rgba(109, 214, 140, 0.1); --color-success-bd: rgba(109, 214, 140, 0.2);
    --color-danger: #f28b82; --color-danger-bg: rgba(242, 139, 130, 0.1); --color-danger-bd: rgba(242, 139, 130, 0.2);
    --color-warn: #f8d889; --color-warn-bg: rgba(248, 216, 137, 0.1); --color-warn-bd: rgba(248, 216, 137, 0.2);
    --radius: 6px; --radius-sm: 4px;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg-main); color: var(--text-main); line-height: 1.5; }
  .icon { display: inline-block; width: 14px; height: 14px; vertical-align: middle; flex-shrink: 0; }
  .icon-check { color: var(--color-success); } .icon-cross { color: var(--color-danger); } .icon-warn { color: var(--color-warn); }
  header { background: var(--bg-main); border-bottom: 1px solid var(--border-color); padding: 32px 40px; }
  header h1 { font-size: 1.5rem; font-weight: 500; }
  header p { color: var(--text-muted); font-size: 0.85rem; margin-top: 4px; }
  .badge { display: inline-flex; align-items: center; gap: 7px; padding: 5px 14px; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 500; margin-top: 16px; border: 1px solid transparent; }
  .badge.pass { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success-bd); }
  .badge.fail { background: var(--color-danger-bg); color: var(--color-danger); border-color: var(--color-danger-bd); }
  .badge.warn { background: var(--color-warn-bg); color: var(--color-warn); border-color: var(--color-warn-bd); }
  main { max-width: 1140px; margin: 40px auto; padding: 0 24px 60px; }
  h2 { font-size: 1.05rem; font-weight: 500; margin: 48px 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 16px; }
  .card { background: var(--bg-card); border-radius: var(--radius); padding: 20px 24px; border: 1px solid var(--border-color); transition: 0.18s; }
  .card:hover { border-color: #5f6368; transform: translateY(-2px); }
  .card .label { font-size: 0.73rem; text-transform: uppercase; color: var(--text-muted); font-weight: 500; }
  .card-label-row { display: flex; align-items: center; gap: 6px; }
  .threshold-chip { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; }
  .chip-pass { background: var(--color-success-bg); } .chip-fail { background: var(--color-danger-bg); }
  .card .value { font-size: 1.75rem; font-weight: 400; margin-top: 8px; }
  .value.green { color: var(--color-success); } .value.red { color: var(--color-danger); } .value.amber { color: var(--color-warn); }
  .chart-wrap { background: var(--bg-card); border-radius: var(--radius); padding: 24px; border: 1px solid var(--border-color); height: 400px; }
  table { width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border-color); }
  th { background: rgba(255,255,255,0.03); color: var(--text-muted); text-align: left; padding: 12px 16px; font-size: 0.73rem; border-bottom: 1px solid var(--border-color); }
  td { padding: 12px 16px; font-size: 0.875rem; border-bottom: 1px solid var(--border-color); }
  tr.success td { background: var(--color-success-bg); } tr.warn td { background: var(--color-warn-bg); } tr.danger td { background: var(--color-danger-bg); }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .no-errors { display: flex; align-items: center; gap: 7px; color: var(--color-success); font-weight: 500; }
  .result-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 100px; font-size: 0.78rem; font-weight: 600; }
  .pill-pass { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success-bd); }
  .pill-fail { background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid var(--color-danger-bd); }
  footer { text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 32px 24px; border-top: 1px solid var(--border-color); margin-top: 40px; }
</style>
</head>
<body>
<header>
  <h1>MoneyMentor — Performance Test Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <div class="badge ${badgeClass}">${badgeIcon} ${badgeText}</div>
</header>
<main>
  <h2>Overview</h2>
  <div class="cards">
    <div class="card"><div class="label">Virtual Users</div><div class="value">${fmtNum(totalCreated)}</div></div>
    <div class="card"><div class="label">Completed</div><div class="value green">${fmtNum(totalCompleted)}</div></div>
    <div class="card"><div class="label">Failed</div><div class="value ${totalFailed > 0 ? "red" : "green"}">${fmtNum(totalFailed)}</div></div>
    <div class="card"><div class="label">Success Rate</div><div class="value ${parseFloat(successRate) >= 99 ? "green" : parseFloat(successRate) >= 90 ? "amber" : "red"}">${successRate}%</div></div>
    <div class="card"><div class="label">Requests</div><div class="value">${fmtNum(totalRequests)}</div></div>
    <div class="card"><div class="label">2xx</div><div class="value green">${fmtNum(total2xx)}</div></div>
    <div class="card"><div class="label">4xx</div><div class="value ${total4xx > 0 ? "amber" : "green"}">${fmtNum(total4xx)}</div></div>
    <div class="card"><div class="label">5xx</div><div class="value ${total5xx > 0 ? "red" : "green"}">${fmtNum(total5xx)}</div></div>
  </div>
  <h2>Response Time</h2>
  <div class="cards">
    <div class="card"><div class="label">Min</div><div class="value">${fmtMs(pMin)}</div></div>
    <div class="card"><div class="label">Median (p50)</div><div class="value">${fmtMs(p50)}</div></div>
    <div class="card"><div class="card-label-row"><span class="label">p95</span>${p95Chip}</div><div class="value ${p95Pass ? "green" : "red"}">${fmtMs(p95)}</div></div>
    <div class="card"><div class="card-label-row"><span class="label">p99</span>${p99Chip}</div><div class="value ${p99Pass ? "green" : "red"}">${fmtMs(p99)}</div></div>
    <div class="card"><div class="label">Max</div><div class="value">${fmtMs(pMax)}</div></div>
  </div>
  <h2>Timeline Dashboard</h2>
  <div class="chart-wrap"><canvas id="timelineChart"></canvas></div>
  <h2>Scenario Breakdown</h2>
  <table><thead><tr><th>Scenario</th><th class="num">VUsers</th><th class="num">Share</th></tr></thead><tbody>${scenarioRows || '<tr><td colspan="3">No scenario data</td></tr>'}</tbody></table>
  <h2>HTTP Status Codes</h2>
  <table><thead><tr><th>Status Code</th><th class="num">Count</th></tr></thead><tbody>${codeRows}</tbody></table>
  <h2>Errors</h2>
  <table><thead><tr><th>Error</th><th class="num">Count</th></tr></thead><tbody>${errorRows}</tbody></table>
  <h2>Thresholds</h2>
  <table>
    <thead><tr><th>Metric</th><th>Threshold</th><th class="num">Actual</th><th>Result</th></tr></thead>
    <tbody>
      <tr class="${p95Pass ? "success" : "danger"}"><td>p95 Response Time</td><td>≤ ${p95Threshold} ms</td><td class="num">${fmtMs(p95)}</td><td>${thresholdResult(p95Pass)}</td></tr>
      <tr class="${p99Pass ? "success" : "danger"}"><td>p99 Response Time</td><td>≤ ${p99Threshold} ms</td><td class="num">${fmtMs(p99)}</td><td>${thresholdResult(p99Pass)}</td></tr>
    </tbody>
  </table>
</main>
<footer>MoneyMentor Performance Report · Artillery v2</footer>
<script>
Chart.defaults.color = '#c4c7c5';
const ctx = document.getElementById('timelineChart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(timelineLabels)},
    datasets: [
      { type: 'line', label: 'p95 Latency', data: ${JSON.stringify(timelineP95)}, borderColor: '#fbd24d', yAxisID: 'y2', order: 1, tension: 0.4 },
      { label: 'Created', data: ${JSON.stringify(timelineCreated)}, backgroundColor: 'rgba(96, 165, 250, 0.85)', yAxisID: 'y', order: 2 },
      { label: 'Failed', data: ${JSON.stringify(timelineFailed)}, backgroundColor: 'rgba(248, 113, 113, 0.85)', yAxisID: 'y', order: 3 }
    ]
  },
  options: { 
    responsive: true, 
    maintainAspectRatio: false, 
    scales: { 
      x: {
        title: { display: true, text: 'Time Offset (Intervals)' }
      },
      y: { 
        position: 'left', 
        beginAtZero: true,
        title: { display: true, text: 'Virtual User Count' }
      }, 
      y2: { 
        position: 'right', 
        grid: { display: false },
        title: { display: true, text: 'Response Time (ms)' }
      } 
    } 
  }
});
</script>
</body></html>`;

fs.writeFileSync(reportHtmlPath, html, "utf8");
console.log("Report generated:", reportHtmlPath);
