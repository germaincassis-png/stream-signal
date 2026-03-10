const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── ISSUE TRACKING ────────────────────────────────────────────────────────────
function getIssueNumber() {
  const trackFile = path.join(__dirname, "../.issue-count");
  if (fs.existsSync(trackFile)) {
    const n = parseInt(fs.readFileSync(trackFile, "utf8").trim(), 10);
    const next = isNaN(n) ? 2 : n + 1;
    fs.writeFileSync(trackFile, String(next));
    return next;
  }
  fs.writeFileSync(trackFile, "2");
  return 1;
}

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the editor of StreamSignal, a premium weekly intelligence newsletter for Sales (AE), Solutions Engineering (SE), and Engineering Leader audiences at a data streaming / AI infrastructure company.

Your job: Research and write a complete, publication-ready weekly newsletter issue on the latest developments in:
- Real-time data streaming (Apache Kafka, Apache Flink, Apache Iceberg, event-driven architecture)
- Enterprise AI infrastructure (agentic AI, LLM deployment, AI agents in production, RAG)
- Market & vendor moves (acquisitions, funding, product launches, partnerships)
- What it means for engineering leaders (architecture, build-vs-buy, governance, cost)

You write for three distinct lenses. Every story MUST include all three:
1. AE/Sales Angle — a sharp, one-sentence conversation opener or objection handler an AE can deploy in a discovery call tomorrow.
2. SE Angle — a technically credible insight about architecture, implementation, or evaluation criteria.
3. Engineering Leader Takeaway — a strategic implication for a VP/Director of Engineering or CTO covering architecture decisions, org impact, risk, cost, or build-vs-buy.

Return ONLY valid JSON in this exact shape (no markdown, no backticks, no preamble):
{
  "issue_date": "string",
  "issue_number": "string",
  "editor_note": "string (2-3 sentences on why this week's themes matter)",
  "weekly_stat": {
    "value": "string",
    "label": "string",
    "context": "string"
  },
  "stories": [
    {
      "tag": "string (one of: M&A, Trend, Signal, Architecture, Market, Open Source, Regulation)",
      "headline": "string",
      "subhead": "string",
      "source": "string",
      "body": "string (3-4 sentences, factual, intelligent)",
      "stat_highlight": "string",
      "stat_label": "string",
      "ae_angle": "string",
      "se_angle": "string",
      "eng_leader_takeaway": "string"
    }
  ],
  "watch_list": [
    { "item": "string", "why": "string" }
  ]
}

Rules:
- 4-5 stories. Prioritize what happened in the last 7 days.
- Sources: MIT Sloan, Kai Waehner blog, Confluent blog, InfoWorld, TechCrunch, IBM Newsroom, Wired, The Register, Futurum Research, VentureBeat, The New Stack.
- AE angle must be immediately deployable in a sales call — not generic.
- SE angle must cite specific tools, protocols, or patterns.
- Eng Leader takeaway must touch on risk, cost, architecture, or org design.
- Watch list: 4-5 forward-looking items only.
- Tone: Authoritative, direct, like a smart analyst talking to peers.
- Return ONLY valid JSON. Nothing else.`;

// ── HTML RENDERER ─────────────────────────────────────────────────────────────
function renderHTML(data, issueNum) {
  const tagColors = {
    "M&A": "#c8401a", "Trend": "#1a4dc8", "Signal": "#2a7a3b",
    "Architecture": "#5a1a7a", "Market": "#7a5a1a",
    "Open Source": "#1a5a7a", "Regulation": "#4a4a4a",
  };

  const stories = (data.stories || []).map((s, i) => {
    const tagColor = tagColors[s.tag] || "#0a0a0f";
    return `
    <div style="border-top:1.5px solid #0a0a0f;padding:28px 0;">
      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;">
        <span style="font-family:monospace;font-size:11px;color:#7a7570;padding-top:3px;min-width:24px;">${String(i+1).padStart(2,"0")}</span>
        <div style="flex:1;">
          <div style="margin-bottom:8px;">
            <span style="display:inline-block;background:${tagColor};color:#f5f3ee;font-family:monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;padding:3px 8px;border-radius:2px;">${s.tag}</span>
          </div>
          <h2 style="font-family:'Georgia',serif;font-size:22px;line-height:1.2;font-weight:400;margin-bottom:4px;color:#0a0a0f;">${s.headline}</h2>
          ${s.subhead ? `<div style="font-size:13px;color:#7a7570;font-style:italic;margin-bottom:4px;">${s.subhead}</div>` : ""}
          <div style="font-family:monospace;font-size:10px;color:#d0cabf;">via ${s.source}</div>
        </div>
      </div>
      <div style="margin-left:38px;">
        <p style="font-size:14.5px;line-height:1.7;color:#222;margin:12px 0;">${s.body}</p>
        ${s.stat_highlight ? `
        <div style="display:inline-flex;flex-direction:column;background:#ede9e0;border:1px solid #d0cabf;padding:10px 18px;border-radius:2px;margin:8px 0;">
          <span style="font-family:'Georgia',serif;font-size:32px;color:#0a0a0f;line-height:1;">${s.stat_highlight}</span>
          <span style="font-family:monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#7a7570;margin-top:3px;">${s.stat_label}</span>
        </div>` : ""}
        <div style="margin-top:16px;">
          <div style="background:#fff8f6;border:1px solid #d0cabf;border-bottom:none;padding:14px 16px;border-radius:2px 2px 0 0;">
            <span style="display:block;font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#c8401a;margin-bottom:5px;font-weight:500;">🎯 AE / Sales — Use This in Your Next Discovery Call</span>
            <span style="font-size:13.5px;line-height:1.6;color:#222;">${s.ae_angle}</span>
          </div>
          <div style="background:#f6f8ff;border:1px solid #d0cabf;border-bottom:none;border-top:none;padding:14px 16px;">
            <span style="display:block;font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#1a4dc8;margin-bottom:5px;font-weight:500;">🔧 SE — Technical Depth to Deploy</span>
            <span style="font-size:13.5px;line-height:1.6;color:#222;">${s.se_angle}</span>
          </div>
          <div style="background:#f6fff8;border:1px solid #d0cabf;padding:14px 16px;border-radius:0 0 2px 2px;">
            <span style="display:block;font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#2a7a3b;margin-bottom:5px;font-weight:500;">🏗️ Engineering Leader — Strategic Takeaway</span>
            <span style="font-size:13.5px;line-height:1.6;color:#222;">${s.eng_leader_takeaway}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join("");

  const watchItems = (data.watch_list || []).map(w => `
    <li style="padding:11px 0;border-bottom:1px solid #d0cabf;font-size:14px;display:flex;gap:12px;align-items:baseline;">
      <span style="font-family:monospace;font-size:11px;color:#c8401a;flex-shrink:0;">→</span>
      <span><strong style="font-weight:600;">${w.item}</strong> <span style="color:#7a7570;font-size:13px;">— ${w.why}</span></span>
    </li>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>StreamSignal — ${data.issue_date}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#e8e4db;font-family:'Inter',sans-serif;padding:20px;}
  .wrap{max-width:680px;margin:0 auto;background:#f5f3ee;border-radius:4px;overflow:hidden;}
</style>
</head>
<body>
<div class="wrap">
  <!-- MASTHEAD -->
  <div style="padding:44px 48px 24px;border-bottom:3px solid #0a0a0f;text-align:center;">
    <div style="font-family:monospace;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#7a7570;margin-bottom:10px;">Intelligence for AE, SE &amp; Engineering Leaders</div>
    <h1 style="font-family:'DM Serif Display','Georgia',serif;font-size:68px;line-height:1;letter-spacing:-1px;color:#0a0a0f;">Stream<em style="font-style:italic;color:#c8401a;">Signal</em></h1>
    <div style="font-family:monospace;font-size:11px;color:#7a7570;letter-spacing:0.1em;margin-top:10px;">Real-Time AI · Data Streaming · What It Means for You</div>
    <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid #d0cabf;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#7a7570;">
      <span>Issue ${issueNum}</span>
      <span>${data.issue_date}</span>
      <span>Weekly · Every Wednesday</span>
    </div>
  </div>

  <div style="padding:0 48px 48px;">
    <!-- EDITOR NOTE -->
    <div style="background:#0a0a0f;color:#f5f3ee;padding:20px 24px;margin:28px 0;border-radius:2px;">
      <div style="font-family:monospace;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#888;margin-bottom:8px;">Editor's Note</div>
      <p style="font-size:14px;line-height:1.65;opacity:0.88;">${data.editor_note}</p>
    </div>

    <!-- WEEKLY STAT -->
    ${data.weekly_stat ? `
    <div style="background:#0a0a0f;color:#f5f3ee;padding:24px 28px;margin:32px 0;border-radius:2px;display:flex;align-items:center;gap:28px;flex-wrap:wrap;">
      <div style="font-family:'DM Serif Display','Georgia',serif;font-size:56px;line-height:1;color:#c8401a;flex-shrink:0;">${data.weekly_stat.value}</div>
      <div>
        <div style="font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:6px;">${data.weekly_stat.label}</div>
        <div style="font-size:14px;opacity:0.85;line-height:1.55;">${data.weekly_stat.context}</div>
      </div>
    </div>` : ""}

    <!-- STORIES LABEL -->
    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 20px;">
      <span style="font-family:monospace;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#7a7570;white-space:nowrap;">This Week's Intelligence</span>
      <div style="flex:1;height:1px;background:#d0cabf;"></div>
      <span style="font-family:monospace;font-size:10px;color:#d0cabf;">Stories</span>
    </div>

    <!-- STORIES -->
    ${stories}

    <!-- WATCH LIST -->
    ${watchItems ? `
    <div style="display:flex;align-items:center;gap:12px;margin:40px 0 20px;">
      <span style="font-family:monospace;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#7a7570;white-space:nowrap;">What to Watch</span>
      <div style="flex:1;height:1px;background:#d0cabf;"></div>
      <span style="font-family:monospace;font-size:10px;color:#d0cabf;">Next 30 Days</span>
    </div>
    <ul style="list-style:none;padding:0;">${watchItems}</ul>` : ""}
  </div>

  <!-- FOOTER -->
  <div style="padding:20px 48px;border-top:3px solid #0a0a0f;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
    <div style="font-family:'DM Serif Display','Georgia',serif;font-size:22px;color:#0a0a0f;">Stream<em style="font-style:italic;color:#c8401a;">Signal</em></div>
    <div style="font-family:monospace;font-size:10px;color:#7a7570;letter-spacing:0.08em;text-align:right;">
      Weekly Intelligence · AI-generated · Issue ${issueNum}<br>
      ${data.issue_date}
    </div>
  </div>
</div>
</body>
</html>`;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  const issueNum = getIssueNumber();
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  console.log(`Generating StreamSignal Issue #${issueNum} for ${today}…`);

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{
      role: "user",
      content: `Generate StreamSignal Issue #${issueNum} for the week of ${today}. Research the most recent significant developments in AI infrastructure, data streaming (Kafka, Flink), agentic AI in production, and vendor/market moves from the past 7 days. Make every lens sharp, specific, and immediately useful. Return only valid JSON.`
    }]
  });

  const fullText = response.content
    .map(b => b.type === "text" ? b.text : "")
    .filter(Boolean).join("\n");

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart === -1) throw new Error("No JSON in response");

let jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);
  
  // Remove control characters that break JSON parsing
  jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
  // Remove trailing commas
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");
  // Fix smart quotes
  jsonStr = jsonStr.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch(e) {
    // Truncate stories array if it's malformed at the end
    const storiesEnd = jsonStr.lastIndexOf('"watch_list"');
    if (storiesEnd > 0) {
      jsonStr = jsonStr.slice(0, storiesEnd) + '"watch_list": [], "weekly_stat": null}';
    }
    data = JSON.parse(jsonStr);
  }

  const data = JSON.parse(jsonStr);
  data.issue_number = String(issueNum);

  // Write current issue to index.html
  const html = renderHTML(data, issueNum);
  fs.writeFileSync(path.join(__dirname, "../index.html"), html, "utf8");
  console.log("✓ index.html updated");

  // Archive this issue
  const archiveDir = path.join(__dirname, "../archive");
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);
  const archiveFile = `issue-${String(issueNum).padStart(3, "0")}.html`;
  fs.writeFileSync(path.join(archiveDir, archiveFile), html, "utf8");

  // Update archive index
  const archiveFiles = fs.readdirSync(archiveDir)
    .filter(f => f.startsWith("issue-") && f.endsWith(".html"))
    .sort().reverse();

  const archiveLinks = archiveFiles.map(f => {
    const n = parseInt(f.replace("issue-", "").replace(".html", ""), 10);
    return `<li style="padding:10px 0;border-bottom:1px solid #d0cabf;font-family:monospace;font-size:13px;">
      <a href="${f}" style="color:#c8401a;text-decoration:none;">Issue #${n}</a>
      <span style="color:#7a7570;margin-left:12px;">${f}</span>
    </li>`;
  }).join("");

  const archiveIndex = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>StreamSignal Archive</title></head>
<body style="background:#e8e4db;font-family:monospace;padding:40px;max-width:600px;margin:0 auto;">
<h1 style="font-family:Georgia,serif;font-size:36px;margin-bottom:8px;">Stream<em style="color:#c8401a;">Signal</em> Archive</h1>
<p style="color:#7a7570;margin-bottom:24px;font-size:12px;">All past issues</p>
<ul style="list-style:none;padding:0;">${archiveLinks}</ul>
<p style="margin-top:24px;"><a href="../index.html" style="color:#c8401a;">← Latest Issue</a></p>
</body></html>`;

  fs.writeFileSync(path.join(archiveDir, "index.html"), archiveIndex, "utf8");
  console.log(`✓ Archive updated (${archiveFiles.length} issues)`);
  console.log(`✓ Done — Issue #${issueNum} published`);
}

main().catch(err => { console.error("✗ Error:", err.message); process.exit(1); });
