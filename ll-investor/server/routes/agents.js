/**
 * /api/agents — Agent pipeline routes
 *
 * POST /api/agents/:businessId/marketing/run
 *   → Marketing agent analyzes metrics, returns insights
 *
 * POST /api/agents/:businessId/management/implement
 *   → Management agent takes an insight, updates website, deploys to Netlify
 *
 * GET  /api/agents/:businessId/activity
 *   → Agent activity log for this business
 */

const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { runMarketingAgent, runManagementAgent, getAgentStatus } = require("../services/agents");
const { createSite, deploySite } = require("../services/netlify");

const prisma = new PrismaClient();

// In-memory activity log per business (persists for session)
const activityLog = {};
function logActivity(businessId, entry) {
  if (!activityLog[businessId]) activityLog[businessId] = [];
  activityLog[businessId].unshift({ ...entry, timestamp: new Date().toISOString() });
  activityLog[businessId] = activityLog[businessId].slice(0, 20);
}

// GET /api/agents/:businessId/activity
router.get("/:businessId/activity", requireAuth, (req, res) => {
  res.json({ activity: activityLog[req.params.businessId] || [] });
});

// POST /api/agents/:businessId/marketing/run
// Marketing agent analyzes current metrics and returns insights
router.post("/:businessId/marketing/run", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({
      where: { id: req.params.businessId, userId: req.userId },
    });
    if (!business) return res.status(404).json({ error: "Business not found" });

    // Get metrics from BusinessOutput
    const metricsOutput = await prisma.businessOutput.findFirst({
      where: { businessId: req.params.businessId, type: "metrics" },
    });
    if (!metricsOutput) return res.status(400).json({ error: "No metrics data found" });

    const metrics = JSON.parse(metricsOutput.content);

    logActivity(req.params.businessId, {
      agent: "marketing",
      action: "Analysis started",
      detail: "Marketing agent scanning performance data for optimization opportunities",
    });

    console.log("[Marketing Agent] Running analysis for", business.name);
    const insights = await runMarketingAgent(business, metrics);

    logActivity(req.params.businessId, {
      agent: "marketing",
      action: `Analysis complete — ${insights.length} insights generated`,
      detail: `Priority actions identified: ${insights.filter(i=>i.priority==="high").length} high, ${insights.filter(i=>i.priority==="medium").length} medium`,
    });

    res.json({ insights });
  } catch (e) { next(e); }
});

// POST /api/agents/:businessId/management/implement
// Management agent implements a specific marketing insight
router.post("/:businessId/management/implement", requireAuth, async (req, res, next) => {
  try {
    const { insight } = req.body;
    if (!insight) return res.status(400).json({ error: "insight is required" });

    if (!process.env.NETLIFY_TOKEN) {
      return res.status(503).json({ error: "NETLIFY_TOKEN not set — add it to Railway environment variables to enable live deployment" });
    }

    const business = await prisma.business.findFirst({
      where: { id: req.params.businessId, userId: req.userId },
    });
    if (!business) return res.status(404).json({ error: "Business not found" });

    logActivity(req.params.businessId, {
      agent: "management",
      action: "Implementation started",
      detail: `Acting on marketing insight: ${insight.recommendation?.slice(0,80)}`,
    });

    // Step 1: Get current website HTML
    const websiteOutput = await prisma.businessOutput.findFirst({
      where: { businessId: req.params.businessId, type: "website" },
    });
    if (!websiteOutput) {
      return res.status(400).json({ error: "Generate the website first in the Content tab — management agent needs a base to update" });
    }

    logActivity(req.params.businessId, {
      agent: "management",
      action: "Generating updated content",
      detail: `Applying: ${insight.managementAction}`,
    });

    // Step 2: Management agent generates updated website
    console.log("[Management Agent] Implementing insight:", insight.type);
    const { html, summary } = await runManagementAgent(business, insight, websiteOutput.content);

    // Step 3: Save new version
    await prisma.businessOutput.update({
      where: { id: websiteOutput.id },
      data:  { content: html },
    });

    logActivity(req.params.businessId, {
      agent: "management",
      action: "Content updated",
      detail: summary,
    });

    // Step 4: Get or create Netlify site
    const token  = process.env.NETLIFY_TOKEN;
    let netlifyIntg = await prisma.integration.findFirst({
      where: { businessId: req.params.businessId, provider: "netlify" },
    });

    let siteId, siteUrl;
    if (netlifyIntg?.status === "connected" && netlifyIntg.metadata) {
      ({ siteId, siteUrl } = JSON.parse(netlifyIntg.metadata));
    } else {
      logActivity(req.params.businessId, { agent:"management", action:"Creating Netlify site", detail:"First deployment — provisioning live URL" });
      const site = await createSite(token, business.name);
      siteId   = site.siteId;
      siteUrl  = site.siteUrl;
      await prisma.integration.upsert({
        where:  { businessId_provider: { businessId: req.params.businessId, provider:"netlify" } },
        update: { status:"connected", metadata:JSON.stringify({ siteId, siteUrl }) },
        create: { businessId: req.params.businessId, provider:"netlify", status:"connected", metadata:JSON.stringify({ siteId, siteUrl }) },
      });
    }

    logActivity(req.params.businessId, {
      agent: "management",
      action: "Deploying to Netlify",
      detail: `Pushing updated website to ${siteUrl}`,
    });

    // Step 5: Deploy
    const { liveUrl, deployId } = await deploySite(token, siteId, html);

    // Step 6: Save updated metadata
    await prisma.integration.updateMany({
      where: { businessId: req.params.businessId, provider: "netlify" },
      data:  { metadata: JSON.stringify({ siteId, siteUrl, liveUrl, deployId, lastDeployed: new Date().toISOString() }) },
    });

    logActivity(req.params.businessId, {
      agent: "management",
      action: "Implementation complete",
      detail: `Live at ${liveUrl} — marketing insight applied successfully`,
    });

    res.json({
      success: true,
      liveUrl,
      deployId,
      summary,
      actionsLog: activityLog[req.params.businessId]?.slice(0, 6) || [],
    });
  } catch (e) { next(e); }
});

// GET /api/agents/:businessId/status
router.get("/:businessId/status", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({
      where: { id: req.params.businessId, userId: req.userId },
    });
    if (!business) return res.status(404).json({ error: "Business not found" });

    const metricsOutput = await prisma.businessOutput.findFirst({
      where: { businessId: req.params.businessId, type: "metrics" },
    });
    if (!metricsOutput) return res.json({ status: "Agents initializing — no metrics data yet." });

    const metrics  = JSON.parse(metricsOutput.content);
    const recent   = (activityLog[req.params.businessId]||[]).slice(0,3).map(a=>a.action);
    const status   = await getAgentStatus(business, metrics, recent);
    res.json({ status });
  } catch (e) { next(e); }
});

module.exports = router;
