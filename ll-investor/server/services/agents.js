/**
 * Marketing Agent + Management Agent services
 *
 * Marketing Agent: analyzes performance data → produces prioritized insights
 * Management Agent: takes an insight → decides what to implement → executes it
 *
 * For the demo, implementation targets the live website (Netlify deploy).
 * The same pipeline would apply to social media posts, booking availability,
 * pricing changes, or email campaigns — same agent logic, different output channel.
 */

const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL   = "claude-sonnet-4-20250514";

function safeJSON(text) {
  const m = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in agent response");
  let s = m[0];
  try { return JSON.parse(s); } catch {
    s = s.replace(/,(\s*[}\]])/g, "$1");
    try { return JSON.parse(s); } catch(e) {
      const last = s.lastIndexOf("},");
      if (last > 0) try { return JSON.parse(s.slice(0,last+1)+"]"); } catch {}
      throw new Error("Agent JSON parse failed: "+e.message);
    }
  }
}

async function chat(prompt, max=2000) {
  const msg = await client.messages.create({
    model: MODEL, max_tokens: max,
    messages: [{ role:"user", content:prompt }],
  });
  return msg.content.find(b=>b.type==="text")?.text||"";
}

// ── MARKETING AGENT ───────────────────────────────────────────────────────────
/**
 * Analyzes performance metrics and generates prioritized action insights.
 * In full auto mode this runs on a schedule; here it runs on demand for the demo.
 */
async function runMarketingAgent(business, metrics) {
  const text = await chat(`
You are the Marketing Agent for "${business.name}" — a ${JSON.parse(business.ideaData||"{}").name} in ${business.location}.

You are running in FULL AUTO mode. Analyze this performance data and identify the most impactful improvements.

Current metrics:
- MRR: $${metrics.revenue.current_month.toLocaleString()} (+${metrics.revenue.growth_pct}% last month)
- Active clients: ${metrics.clients.active} (${metrics.clients.retention_rate}% retention)
- Instagram followers: ${metrics.social.instagram_followers} (+${metrics.social.instagram_growth_30d}% this month)
- Avg engagement rate: ${metrics.social.avg_engagement_rate}% (industry avg: 1.9%)
- Total reach 30d: ${metrics.marketing.total_reach_30d.toLocaleString()}
- Leads this month: ${metrics.marketing.leads_generated} (${metrics.marketing.conversion_rate_pct}% close rate)
- Pipeline prospects: ${metrics.clients.pipeline}
- Posts scheduled: ${metrics.operations.posts_scheduled}

Generate 4 marketing insights. Each must be specific, data-backed, and immediately actionable.
For the demo, one insight must target the website (type: "website") as the implementation channel.
Other insights should target: social (type: "social"), pricing (type: "pricing"), and outreach (type: "outreach").

Return ONLY a JSON array. No double quotes inside string values. No apostrophes inside string values.

[{
  "id": "insight-1",
  "type": "website",
  "priority": "high",
  "agentObservation": "What the marketing agent noticed in the data — cite specific numbers",
  "recommendation": "What should change and why — specific and actionable",
  "expectedImpact": "Projected business outcome if implemented — use numbers",
  "implementationChannel": "Website homepage and hero section",
  "managementAction": "What the management agent will do to implement this — one sentence"
}]
`, 2000);
  return safeJSON(text);
}

// ── MANAGEMENT AGENT ──────────────────────────────────────────────────────────
/**
 * Takes a marketing insight and generates the implementation plan + content.
 * For website insights: regenerates website HTML with the specific change applied.
 * Returns the new content and a human-readable implementation summary.
 */
async function runManagementAgent(business, insight, currentWebsiteHtml) {
  const idea   = JSON.parse(business.ideaData  ||"{}");
  const intake = JSON.parse(business.intakeData ||"{}");

  const text = await chat(`
You are the Management Agent for "${business.name}".

The Marketing Agent flagged this insight for immediate implementation:
- Observation: ${insight.agentObservation}
- Recommendation: ${insight.recommendation}
- Expected impact: ${insight.expectedImpact}
- Implementation channel: ${insight.implementationChannel}
- Action required: ${insight.managementAction}

Business context:
- Type: ${idea.name}
- Location: ${business.location}
- Services: Starter $500/mo, Growth $850/mo, Premium $1,400/mo
- Current MRR: $8,400/mo

You are implementing this by updating the live website.
Take the existing website and apply the marketing agent recommendation precisely.
Keep everything else the same. Only change what the recommendation specifies.
Make the change prominent and specific — investors watching this demo need to see a clear difference.

Return ONLY the complete updated HTML file — no markdown, no explanation, no fences.
Start directly with <!DOCTYPE html>

Current website HTML to update:
${currentWebsiteHtml.slice(0, 8000)}
`, 8000);

  const html = text.replace(/^```html?\s*/i,"").replace(/\s*```\s*$/i,"").trim();

  return {
    html,
    summary: `Management agent implemented: ${insight.recommendation.slice(0,120)}`,
  };
}

// ── AGENT STATUS REPORT ───────────────────────────────────────────────────────
/**
 * Generates a plain-language status for what both agents are doing right now.
 * Shown in the agent activity feed.
 */
async function getAgentStatus(business, metrics, recentActions) {
  const text = await chat(`
You are the AI orchestrator for "${business.name}".
Write a brief status update (3 sentences max) describing what the marketing and management agents are currently doing based on this data.

Current metrics snapshot: MRR $${metrics.revenue.current_month.toLocaleString()}, ${metrics.clients.active} clients, ${metrics.social.instagram_followers} Instagram followers, ${metrics.marketing.leads_generated} leads this month.
Recent agent actions: ${recentActions.join("; ")||"None yet — agents initializing."}

Write as if you are the system reporting status. Be specific and confident. No double quotes or apostrophes inside the response.
`, 400);
  return text.trim();
}

module.exports = { runMarketingAgent, runManagementAgent, getAgentStatus };
