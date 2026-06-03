const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL  = "claude-sonnet-4-20250514";

// ── ROBUST JSON PARSER ────────────────────────────────────────────────────────
// Handles: markdown fences, trailing commas, truncated arrays, unescaped apostrophes
function safeParseJSON(text) {
  // 1. Strip markdown fences if present
  let s = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  // 2. Find the outermost JSON array or object
  const match = s.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON structure found in response");
  s = match[0];

  // 3. Direct parse
  try { return JSON.parse(s); } catch (e1) {

    // 4. Fix trailing commas before } or ]
    const s2 = s.replace(/,(\s*[}\]])/g, "$1");
    try { return JSON.parse(s2); } catch (e2) {

      // 5. Truncate to last complete object and close the array
      const lastClose = s2.lastIndexOf("},");
      if (lastClose > 10) {
        const truncated = s2.slice(0, lastClose + 1) + "]";
        try {
          const parsed = JSON.parse(truncated);
          console.warn(`[AI] JSON truncated — returning ${parsed.length} of requested items`);
          return parsed;
        } catch {}
      }

      // 6. Nothing worked — report the original error with context
      const snippet = s.slice(Math.max(0, (e1.message.match(/position (\d+)/)?.[1]||0) - 40), +(e1.message.match(/position (\d+)/)?.[1]||0) + 40);
      throw new Error(`JSON parse failed: ${e1.message} | near: ...${snippet}...`);
    }
  }
}

async function chat(prompt, max = 3000) {
  const msg = await client.messages.create({
    model: MODEL, max_tokens: max,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content.find(b => b.type === "text")?.text || "";
}

// ── IDEA GENERATION ────────────────────────────────────────────────────────────
async function generateIdeas(intake) {
  const text = await chat(`
You are a business intelligence analyst. Generate exactly 5 business opportunities. Return ONLY a valid JSON array — no markdown, no explanation.

CRITICAL JSON RULES:
- Do NOT use double-quote characters inside any string value — rephrase without them
- Do NOT use apostrophes inside string values — rephrase without them
- Keep all string values short (under 20 words each)
- No trailing commas

Profile:
Location: ${intake.location}
Hours per week: ${intake.hours}
Capital: $${Number(intake.budget).toLocaleString()}
Skills: ${intake.skills?.join(", ") || "general business"}
Assets: ${intake.assets?.join(", ") || "none specified"}
Risk profile: ${intake.risk || "moderate"}
Revenue target: ${intake.incomeGoal || "not specified"}
${intake.ownIdea ? "Analyze this idea first: " + intake.ownIdea : ""}

Return exactly this structure — 5 objects, all fields required:
[{"name":"Business Name","tagline":"Value prop under 12 words","why":"2 sentences on fit — cite their skills and location","revenue":"$X,XXX-$X,XXX/mo","timeToFirstRevenue":"X-Y weeks","startupCost":"$X-$X,XXX","biggestRisk":"One risk sentence","estimatedMargin":"XX-XX percent gross margin","scores":{"Fit":8.5,"Market":7.0,"Capital":9.0,"Time":8.0,"Risk":7.5,"Upside":8.0}}]
`, 3500);
  return safeParseJSON(text);
}

// ── TASK GENERATION ────────────────────────────────────────────────────────────
async function generateTasks(idea, intake) {
  const text = await chat(`
Generate a business setup checklist for "${idea.name}" in ${intake.location}. Budget: $${Number(intake.budget).toLocaleString()}.
Return ONLY a valid JSON array — no markdown, no explanation.

CRITICAL JSON RULES:
- Do NOT use double-quote characters inside any string value
- Do NOT use apostrophes inside string values
- Keep descriptions concise — under 20 words per field
- No trailing commas

Generate 8-12 tasks. Each object:
{"name":"Task name","category":"Legal or Financial or Digital or Operations or Marketing","description":"What to do and why — no quotes or apostrophes","estimatedTime":"X hours","estimatedCost":"$X or Free","canAutomate":true,"steps":[{"text":"Step description","url":"https://url.com or null"}]}

Sort by: legal foundation first, then financial setup, then digital presence, then marketing. Be specific to ${idea.name} in ${intake.location}.
`, 2500);
  return safeParseJSON(text);
}

// ── WEBSITE GENERATION ─────────────────────────────────────────────────────────
async function generateWebsite(business, idea, intake) {
  const text = await chat(`
Create a complete, professional single-page website. Output ONLY the raw HTML file — no markdown fences, no explanation.

Business: ${business.name}
Type: ${idea.name}
Location: ${business.location}
Tagline: ${business.tagline || idea.tagline || "Professional services"}
Revenue range: ${idea.revenue}

Requirements:
- Standalone HTML with all CSS in a style tag
- Professional color scheme: dark navy (#0A0F1E) with gold (#D4AF37) accents
- Sections: Hero, Problem and Solution, Services with pricing, Trust signals, Contact form
- Mobile responsive CSS media queries
- Contact form with JS validation — show thank-you message on submit, no backend
- No external dependencies except Google Fonts (Inter)
- Schema.org LocalBusiness markup
`, 7000);
  return text.replace(/^```html?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

// ── BUSINESS PLAN ──────────────────────────────────────────────────────────────
async function generateBusinessPlan(business, idea, intake) {
  const text = await chat(`
Write a detailed business plan for ${business.name} (${idea.name}). Output ONLY clean HTML with inline styles — no markdown.

Data: Budget $${business.budget.toLocaleString()} | Revenue target ${idea.revenue} | Location: ${business.location} | Hours/week: ${business.hoursPerWeek}
Skills: ${intake.skills?.join(", ") || "general"} | Assets: ${intake.assets?.join(", ") || "none"}

Sections: Executive Summary, Market Analysis, Business Model, Revenue and Pricing, Unit Economics, 12-Month Financial Projection table, Customer Acquisition Plan, Competitive Analysis, Risk Assessment, 90-Day Action Plan.

Use tables and clear formatting. Professional but readable.
`, 7000);
  return text.replace(/^```html?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

// ── SOCIAL CONTENT ─────────────────────────────────────────────────────────────
async function generateSocialContent(business, idea, intake) {
  const text = await chat(`
Create a 30-day content calendar for "${business.name}" (${idea.name} in ${business.location}).
Return ONLY a valid JSON object — no markdown.

CRITICAL JSON RULES:
- No double-quote characters inside string values — rephrase without them
- No apostrophes inside string values
- Keep all captions under 50 words

{"posts":[{"day":1,"platform":"LinkedIn","type":"Launch announcement","caption":"Caption text here","hashtags":["tag1","tag2"]}],"bio":{"linkedin":"LinkedIn description","instagram":"Instagram bio under 150 chars","google":"Google Business description"}}

Generate 30 posts alternating LinkedIn and Instagram.
`, 4000);
  return safeParseJSON(text);
}

// ── EMAIL TEMPLATES ────────────────────────────────────────────────────────────
async function generateEmailTemplates(business, idea) {
  const text = await chat(`
Create 8 professional email templates for "${business.name}" (${idea.name}).
Return ONLY a valid JSON object — no markdown.

CRITICAL JSON RULES:
- No double-quote characters inside string values
- No apostrophes inside string values
- Keep body fields under 100 words each

{"templates":[{"name":"Template name","subject":"Subject line","body":"Email body using [FIRST_NAME] placeholders","purpose":"When to send this"}]}

Templates: Welcome, Booking Confirmation, Appointment Reminder, Post-Service Follow-Up, Referral Program, Quarterly Review, Re-Engagement, Promotional Offer.
`, 3000);
  return safeParseJSON(text);
}

// ── PITCH DECK ─────────────────────────────────────────────────────────────────
async function generatePitchDeck(business, idea, intake) {
  const text = await chat(`
Create an investor pitch deck for "${business.name}" as clean HTML. Output ONLY raw HTML — no markdown.

Business: ${idea.name} | ${business.location} | Revenue target: ${idea.revenue} | Startup cost: ${idea.startupCost}

10 slides: Cover, Problem and Market Size, Solution, Business Model, Revenue Projections, Unit Economics, Competitive Moat, Go-To-Market Strategy, Team and Execution, Investment Ask.

Dark background (#0A0F1E), gold accents (#D4AF37), professional typography. Each slide clearly separated.
`, 5000);
  return text.replace(/^```html?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
async function chatResponse(message, context) {
  const text = await chat(`
You are a business analyst advising an investor building a new venture.
Business context: ${JSON.stringify(context)}
Question: ${message}
Answer in 2-3 sentences. Use specific numbers where possible. Be direct.
`, 600);
  return text.trim();
}

module.exports = { generateIdeas, generateTasks, generateWebsite, generateBusinessPlan, generateSocialContent, generateEmailTemplates, generatePitchDeck, chatResponse };
