/**
 * Demo seed — creates Jo Liberman's account with a fully operational
 * "LocalPulse Media" business. Runs automatically on server start.
 * Safe to run multiple times (idempotent).
 */

require("dotenv").config();
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "file:./prod.db";

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// ── DEMO WEBSITE HTML ─────────────────────────────────────────────────────────
const WEBSITE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>LocalPulse Media — Social Media & Content for Local Businesses</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;color:#0A0F1E;background:#fff}
nav{position:sticky;top:0;background:#fff;border-bottom:1px solid #E2E4E9;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;z-index:100}
.logo{font-weight:700;font-size:18px;letter-spacing:-0.04em}.logo span{color:#D4AF37}
.nav-cta{background:#0A0F1E;color:#fff;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:500;text-decoration:none}
.hero{background:linear-gradient(135deg,#0A0F1E 0%,#1a2744 100%);color:#fff;padding:100px 48px;text-align:center}
.hero h1{font-size:54px;font-weight:700;letter-spacing:-0.04em;line-height:1.05;margin-bottom:20px}
.hero h1 span{color:#D4AF37}
.hero p{font-size:18px;color:#ffffff80;max-width:540px;margin:0 auto 40px;line-height:1.7}
.hero-cta{display:inline-flex;gap:12px}
.btn-primary{background:#D4AF37;color:#0A0F1E;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none}
.btn-secondary{background:transparent;color:#fff;border:1.5px solid #ffffff30;padding:14px 28px;border-radius:8px;font-weight:500;font-size:15px;text-decoration:none}
.stats{display:flex;justify-content:center;gap:64px;margin-top:64px;padding-top:40px;border-top:1px solid #ffffff12}
.stat-num{font-size:36px;font-weight:700;color:#D4AF37;letter-spacing:-0.03em}
.stat-label{font-size:12px;color:#ffffff50;text-transform:uppercase;letter-spacing:0.06em;margin-top:4px}
section{padding:80px 48px;max-width:1100px;margin:0 auto}
.section-label{font-size:11px;font-weight:600;color:#D4AF37;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px}
h2{font-size:38px;font-weight:700;letter-spacing:-0.04em;margin-bottom:16px;line-height:1.15}
.services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px}
.service-card{background:#F8F8F8;border-radius:12px;padding:28px;border:1px solid #E2E4E9}
.service-card h3{font-size:16px;font-weight:600;margin-bottom:8px}
.service-card p{font-size:13px;color:#64748B;line-height:1.6;margin-bottom:16px}
.price{font-size:28px;font-weight:700;letter-spacing:-0.03em}
.price span{font-size:14px;font-weight:400;color:#64748B}
.features{list-style:none;margin-top:16px}
.features li{font-size:13px;color:#64748B;padding:5px 0;border-bottom:1px solid #E2E4E9;display:flex;gap:8px}
.features li::before{content:"+";color:#D4AF37;font-weight:700;flex-shrink:0}
.results-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-top:48px}
.result-card{background:#0A0F1E;color:#fff;border-radius:12px;padding:28px}
.result-card .metric{font-size:42px;font-weight:700;color:#D4AF37;letter-spacing:-0.04em}
.result-card .metric-label{font-size:13px;color:#ffffff60;margin-top:4px}
.result-card .client-name{font-size:14px;font-weight:500;margin-top:16px;padding-top:16px;border-top:1px solid #ffffff12}
.testimonials{background:#F8F8F8;border-radius:16px;padding:48px;margin-top:64px}
.testimonial-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:32px}
.testimonial{background:#fff;border-radius:10px;padding:24px;border:1px solid #E2E4E9}
.testimonial p{font-size:14px;line-height:1.7;color:#374151;font-style:italic}
.testimonial .author{font-size:13px;font-weight:600;color:#0A0F1E;margin-top:12px}
.testimonial .author span{font-weight:400;color:#64748B}
.contact{background:#0A0F1E;color:#fff;border-radius:16px;padding:56px;margin-top:80px;text-align:center}
.contact h2{color:#fff;margin-bottom:12px}
.contact p{color:#ffffff60;margin-bottom:36px}
.contact-form{display:flex;flex-direction:column;gap:14px;max-width:480px;margin:0 auto;text-align:left}
.contact-form input,.contact-form textarea,.contact-form select{background:#ffffff12;border:1px solid #ffffff20;border-radius:8px;padding:12px 16px;color:#fff;font-family:'Inter',sans-serif;font-size:14px;outline:none;width:100%}
.contact-form textarea{resize:vertical;min-height:100px}
.contact-form button{background:#D4AF37;color:#0A0F1E;border:none;border-radius:8px;padding:14px;font-weight:600;font-size:15px;cursor:pointer}
.success-msg{display:none;background:#ECFDF5;color:#059669;border-radius:8px;padding:16px;text-align:center;font-weight:500}
footer{padding:40px 48px;border-top:1px solid #E2E4E9;display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#94A3B8;max-width:1100px;margin:0 auto}
@media(max-width:768px){.hero h1{font-size:36px}.services-grid,.results-grid,.testimonial-grid{grid-template-columns:1fr}.stats{flex-wrap:wrap;gap:32px}section{padding:48px 24px}nav{padding:0 24px}}
</style>
</head>
<body>
<nav>
  <div class="logo">Local<span>Pulse</span> Media</div>
  <a href="#contact" class="nav-cta">Get started</a>
</nav>
<div class="hero">
  <h1>Social media that actually<br/><span>grows local businesses.</span></h1>
  <p>We handle content creation, community management, and paid ads for local businesses in Philadelphia — so you can focus on running your business.</p>
  <div class="hero-cta">
    <a href="#contact" class="btn-primary">Book a free strategy call</a>
    <a href="#results" class="btn-secondary">See our results</a>
  </div>
  <div class="stats">
    <div><div class="stat-num">47+</div><div class="stat-label">Local clients served</div></div>
    <div><div class="stat-num">312%</div><div class="stat-label">Avg engagement increase</div></div>
    <div><div class="stat-num">$2.1M</div><div class="stat-label">Revenue driven for clients</div></div>
    <div><div class="stat-num">4.9★</div><div class="stat-label">Client satisfaction</div></div>
  </div>
</div>
<section>
  <div class="section-label">Our services</div>
  <h2>Everything your business needs<br/>to dominate locally online.</h2>
  <div class="services-grid">
    <div class="service-card">
      <h3>Starter Package</h3>
      <p>Perfect for businesses just getting started with social media.</p>
      <div class="price">$500<span>/month</span></div>
      <ul class="features">
        <li>12 posts per month</li><li>Instagram and Facebook</li><li>Custom graphics and copy</li><li>Monthly performance report</li><li>Community management</li>
      </ul>
    </div>
    <div class="service-card" style="border-color:#D4AF37;position:relative">
      <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#D4AF37;color:#0A0F1E;font-size:10px;font-weight:700;padding:3px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.06em">Most popular</div>
      <h3>Growth Package</h3>
      <p>For businesses ready to scale their local presence fast.</p>
      <div class="price">$850<span>/month</span></div>
      <ul class="features">
        <li>24 posts per month</li><li>All major platforms</li><li>Paid ad management ($500 budget)</li><li>Weekly analytics reports</li><li>Google Business optimization</li><li>Story and Reel content</li>
      </ul>
    </div>
    <div class="service-card">
      <h3>Premium Package</h3>
      <p>Full-service content marketing for serious growth.</p>
      <div class="price">$1,400<span>/month</span></div>
      <ul class="features">
        <li>40+ posts per month</li><li>Video content production</li><li>Paid ads on all platforms ($1,500 budget)</li><li>Email marketing</li><li>SEO content</li><li>Dedicated account manager</li>
      </ul>
    </div>
  </div>
</section>
<section id="results">
  <div class="section-label">Client results</div>
  <h2>Real results for real<br/>Philadelphia businesses.</h2>
  <div class="results-grid">
    <div class="result-card"><div class="metric">+428%</div><div class="metric-label">Instagram follower growth in 90 days</div><div class="client-name">Rittenhouse Pet Supply Co.</div></div>
    <div class="result-card"><div class="metric">$18K</div><div class="metric-label">Additional monthly revenue from social campaigns</div><div class="client-name">South Philly Kitchen and Bar</div></div>
    <div class="result-card"><div class="metric">312%</div><div class="metric-label">Increase in Google Business profile views</div><div class="client-name">Fishtown Wellness Collective</div></div>
    <div class="result-card"><div class="metric">4.2×</div><div class="metric-label">Return on paid social ad spend</div><div class="client-name">Old City Boutique Hotel</div></div>
  </div>
  <div class="testimonials">
    <h3 style="font-size:22px;font-weight:700;letter-spacing:-0.03em">What our clients say</h3>
    <div class="testimonial-grid">
      <div class="testimonial"><p>"LocalPulse completely transformed our online presence. We went from 200 Instagram followers to over 4,000 in three months — and our walk-in traffic doubled."</p><div class="author">Maria Chen <span>— Rittenhouse Pet Supply</span></div></div>
      <div class="testimonial"><p>"I was spending hours a week on social media and getting nowhere. LocalPulse took it over and we started getting table reservations directly from Instagram. Worth every penny."</p><div class="author">James Kowalski <span>— South Philly Kitchen</span></div></div>
      <div class="testimonial"><p>"They understand local Philadelphia businesses. The content feels authentic, not corporate. Our regulars love it and new customers keep saying they found us on Instagram."</p><div class="author">Priya Sharma <span>— Fishtown Wellness</span></div></div>
      <div class="testimonial"><p>"The monthly reports actually show what the money is doing. I can see leads, reach, and bookings from our social campaigns. Transparent and effective."</p><div class="author">David Park <span>— Old City Boutique Hotel</span></div></div>
    </div>
  </div>
</section>
<section id="contact" style="max-width:1100px">
  <div class="contact">
    <div class="section-label" style="color:#D4AF37">Get started</div>
    <h2>Ready to grow your local business?</h2>
    <p>Book a free 30-minute strategy call. We will audit your current social presence and show you exactly how we would grow it.</p>
    <form class="contact-form" onsubmit="document.getElementById('success').style.display='block';this.style.display='none';return false">
      <input placeholder="Business name" required /><input placeholder="Your name" required /><input type="email" placeholder="Email address" required /><input type="tel" placeholder="Phone number" />
      <select><option value="">Monthly marketing budget</option><option>Under $500</option><option>$500 - $1,000</option><option>$1,000 - $2,500</option><option>$2,500+</option></select>
      <textarea placeholder="Tell us about your business and your biggest marketing challenge right now..."></textarea>
      <button type="submit">Book my free strategy call</button>
    </form>
    <div id="success" class="success-msg">Thank you! We will reach out within 24 hours to schedule your call.</div>
  </div>
</section>
<footer><span>© 2025 LocalPulse Media LLC — Philadelphia, PA</span><span>hello@localpulsemedia.com</span></footer>
</body>
</html>`;

// ── DEMO METRICS ──────────────────────────────────────────────────────────────
const DEMO_METRICS = {
  revenue: {
    current_month: 8400,
    last_month: 7200,
    growth_pct: 16.7,
    weekly: [
      { week: "Week 1", amount: 1800 },
      { week: "Week 2", amount: 2100 },
      { week: "Week 3", amount: 2200 },
      { week: "Week 4", amount: 2300 },
    ],
    mrr_trend: [3200, 4100, 4800, 5600, 6200, 7200, 8400],
    mrr_labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  clients: {
    active: 6,
    pipeline: 3,
    total_served: 14,
    retention_rate: 94,
    avg_contract_value: 1400,
    list: [
      { name: "Rittenhouse Pet Supply", package: "Growth", mrr: 850, since: "Aug 2024", status: "active" },
      { name: "South Philly Kitchen & Bar", package: "Premium", mrr: 1400, since: "Sep 2024", status: "active" },
      { name: "Fishtown Wellness Collective", package: "Growth", mrr: 850, since: "Oct 2024", status: "active" },
      { name: "Old City Boutique Hotel", package: "Premium", mrr: 1400, since: "Oct 2024", status: "active" },
      { name: "Northern Liberties Coffee Co.", package: "Starter", mrr: 500, since: "Nov 2024", status: "active" },
      { name: "Manayunk Running Club", package: "Starter", mrr: 500, since: "Dec 2024", status: "active" },
    ],
  },
  social: {
    instagram_followers: 1240,
    instagram_growth_30d: 12.3,
    avg_engagement_rate: 4.8,
    posts_this_month: 18,
    reels_avg_views: 3400,
    stories_completion_rate: 68,
    top_post_reach: 12400,
  },
  marketing: {
    total_reach_30d: 284500,
    impressions_30d: 641000,
    leads_generated: 12,
    strategy_calls_booked: 5,
    conversion_rate_pct: 25,
    cost_per_lead: 0,
    google_profile_views: 3200,
    google_calls: 47,
  },
  operations: {
    active_campaigns: 14,
    posts_scheduled: 38,
    pending_approvals: 4,
    avg_response_time_hrs: 1.4,
    content_pieces_this_month: 72,
    reports_delivered: 6,
  },
  activity: [
    { type: "revenue", text: "Invoice paid — South Philly Kitchen & Bar $1,400", time: "2 hours ago" },
    { type: "client", text: "Strategy call booked — Bella Vista Yoga (pipeline)", time: "4 hours ago" },
    { type: "social", text: "Fishtown Wellness Reel hit 8,200 views — boosting", time: "6 hours ago" },
    { type: "report", text: "December performance report sent to all 6 clients", time: "Yesterday" },
    { type: "client", text: "Manayunk Running Club onboarded — first content goes live Friday", time: "2 days ago" },
    { type: "revenue", text: "Invoice paid — Old City Boutique Hotel $1,400", time: "3 days ago" },
    { type: "social", text: "Northern Liberties Coffee Co. crossed 1,000 Instagram followers", time: "4 days ago" },
    { type: "client", text: "Renewal signed — Rittenhouse Pet Supply (month 5)", time: "5 days ago" },
  ],
};

// ── DEMO TASKS ────────────────────────────────────────────────────────────────
const DEMO_TASKS = [
  { name:"Register Pennsylvania LLC", category:"Legal", description:"LocalPulse Media LLC registered with the PA Department of State. EIN obtained from IRS.", canAutomate:false, output:{ fields:[{label:"Entity name",value:"LocalPulse Media LLC"},{label:"State",value:"Pennsylvania"},{label:"EIN",value:"87-4421039"},{label:"Registered agent",value:"On file"}] } },
  { name:"Open business bank account", category:"Financial", description:"Mercury business checking account opened and connected to Stripe for automatic payouts.", canAutomate:true, output:{ fields:[{label:"Bank",value:"Mercury Business Checking"},{label:"Status",value:"Active"},{label:"Stripe connected",value:"Yes — daily payouts"}] } },
  { name:"Build client website", category:"Digital", description:"Professional website at localpulsemedia.com with service packages, case studies, and booking form.", canAutomate:true, output:{ fields:[{label:"Domain",value:"localpulsemedia.com"},{label:"Status",value:"Live"},{label:"Monthly visitors",value:"1,240"},{label:"Lead form submissions",value:"47 this month"}], downloadAvailable:true, type:"website" } },
  { name:"Set up Stripe payments", category:"Financial", description:"Stripe account configured for recurring monthly subscriptions and one-time project billing.", canAutomate:true, output:{ fields:[{label:"Status",value:"Active"},{label:"MRR processing",value:"$8,400/month"},{label:"Payout schedule",value:"Daily to Mercury"}] } },
  { name:"Create Google Business Profile", category:"Digital", description:"Google Business Profile verified and optimized for local Philadelphia search results.", canAutomate:true, output:{ fields:[{label:"Status",value:"Verified"},{label:"Profile views this month",value:"3,200"},{label:"Phone calls generated",value:"47"},{label:"Rating",value:"4.9 stars (31 reviews)"}] } },
  { name:"Set up client onboarding system", category:"Operations", description:"Notion workspace + Calendly booking flow for new client strategy calls and onboarding.", canAutomate:true, output:{ fields:[{label:"Booking link",value:"calendly.com/localpulsemedia"},{label:"Onboarding workspace",value:"Notion — active"},{label:"Avg onboarding time",value:"48 hours"}] } },
  { name:"Define service packages and pricing", category:"Operations", description:"Three-tier service model: Starter $500, Growth $850, Premium $1,400 per month.", canAutomate:false, output:{ fields:[{label:"Starter",value:"$500/mo — 12 posts, 2 platforms"},{label:"Growth",value:"$850/mo — 24 posts, all platforms + ads"},{label:"Premium",value:"$1,400/mo — full service + video"}] } },
  { name:"Launch Instagram business account", category:"Marketing", description:"@localpulsemedia live with optimized bio, highlight reels, and initial content batch.", canAutomate:true, output:{ fields:[{label:"Handle",value:"@localpulsemedia"},{label:"Followers",value:"1,240"},{label:"Engagement rate",value:"4.8%"},{label:"Avg Reel views",value:"3,400"}] } },
  { name:"Acquire first three clients", category:"Operations", description:"Closed Rittenhouse Pet Supply, South Philly Kitchen, and Fishtown Wellness through network and referrals.", canAutomate:false, output:{ fields:[{label:"Client 1",value:"Rittenhouse Pet Supply — $850/mo"},{label:"Client 2",value:"South Philly Kitchen — $1,400/mo"},{label:"Client 3",value:"Fishtown Wellness — $850/mo"}] } },
  { name:"Build automated reporting system", category:"Operations", description:"Monthly performance reports auto-generated and emailed to all clients on the 1st of each month.", canAutomate:true, output:{ fields:[{label:"Status",value:"Running"},{label:"Reports sent this month",value:"6"},{label:"Client open rate",value:"100%"},{label:"Avg satisfaction score",value:"4.9/5"}] } },
];

// ── SEED ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("[Seed] Checking demo account...");

  const existing = await prisma.user.findUnique({ where: { email: "jo@launchlab.demo" } });
  if (existing) {
    console.log("[Seed] Demo account exists — skipping.");
    return;
  }

  console.log("[Seed] Creating Jo Liberman demo account...");

  const password = await bcrypt.hash("12345678", 12);
  const user = await prisma.user.create({
    data: { name: "Jo Liberman", email: "jo@launchlab.demo", password, goal: "build_company" },
  });

  // Create subscription (Pro plan)
  await prisma.subscription.create({
    data: { userId: user.id, plan: "pro", status: "active", addons: JSON.stringify(["auto_management","auto_marketing"]) },
  });

  const idea = {
    name: "Social Media & Content Creation Agency",
    tagline: "Full-service social media for Philadelphia local businesses",
    why: "LocalPulse Media addresses a clear gap in the Philadelphia market — local businesses need professional social media management but cannot afford enterprise agencies. With a lean operational model and a three-tier pricing structure, this business achieves strong margins from month one.",
    revenue: "$7,000-$15,000/mo",
    timeToFirstRevenue: "1-2 weeks",
    startupCost: "$800-$1,500",
    biggestRisk: "Client churn during slow business seasons",
    estimatedMargin: "78-85 percent gross margin",
    scores: { Fit: 9.2, Market: 8.8, Capital: 9.6, Time: 8.4, Risk: 8.1, Upside: 9.0 },
  };

  const intake = {
    location: "Philadelphia, PA",
    hours: 30,
    budget: 1200,
    skills: ["Social media management", "Graphic design", "Copywriting", "Facebook Ads", "SEO"],
    assets: ["MacBook Pro", "Adobe Creative Suite", "DSLR camera"],
    risk: "medium",
    incomeGoal: "Replace full-time salary within 6 months — target $10,000/month MRR",
    businessExperience: "some",
  };

  const business = await prisma.business.create({
    data: {
      userId: user.id,
      name: "LocalPulse Media",
      tagline: "Social media that actually grows local businesses.",
      location: "Philadelphia, PA",
      budget: 1200,
      hoursPerWeek: 30,
      status: "live",
      ideaData: JSON.stringify(idea),
      intakeData: JSON.stringify(intake),
    },
  });

  // Create tasks (all done)
  for (let i = 0; i < DEMO_TASKS.length; i++) {
    const t = DEMO_TASKS[i];
    await prisma.task.create({
      data: {
        businessId: business.id,
        name: t.name, category: t.category, description: t.description,
        status: "done", mode: t.canAutomate ? "auto" : "guided",
        estimatedTime: "Completed", estimatedCost: "Done",
        canAutomate: t.canAutomate,
        steps: "[]",
        outputData: JSON.stringify(t.output),
        sortOrder: i,
      },
    });
  }

  // Generated outputs
  await prisma.businessOutput.create({
    data: { businessId: business.id, type: "website", title: "LocalPulse Media — Website", content: WEBSITE_HTML },
  });

  await prisma.businessOutput.create({
    data: {
      businessId: business.id, type: "metrics", title: "Live Business Metrics",
      content: JSON.stringify(DEMO_METRICS),
    },
  });

  await prisma.businessOutput.create({
    data: {
      businessId: business.id, type: "business_plan", title: "LocalPulse Media — Business Plan",
      content: `<html><body style="font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#0A0F1E"><h1 style="font-size:32px;font-weight:700;letter-spacing:-0.04em;margin-bottom:8px">LocalPulse Media</h1><p style="color:#64748B;margin-bottom:40px">Business Plan — December 2024</p><h2 style="font-size:20px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #D4AF37">Executive Summary</h2><p style="line-height:1.8;margin-bottom:24px;color:#374151">LocalPulse Media is a Philadelphia-based social media agency serving local small and medium businesses. The company provides content creation, community management, and paid advertising services on a monthly retainer model. Current MRR: $8,400. Gross margin: 82%. Projected 12-month MRR: $18,000-$22,000.</p><h2 style="font-size:20px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #D4AF37">Financial Snapshot</h2><table style="width:100%;border-collapse:collapse;margin-bottom:24px"><tr style="background:#F8F8F8"><th style="text-align:left;padding:10px;font-size:13px;border:1px solid #E2E4E9">Metric</th><th style="text-align:right;padding:10px;font-size:13px;border:1px solid #E2E4E9">Current</th><th style="text-align:right;padding:10px;font-size:13px;border:1px solid #E2E4E9">Month 6 Target</th><th style="text-align:right;padding:10px;font-size:13px;border:1px solid #E2E4E9">Month 12 Target</th></tr><tr><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px">MRR</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right;font-weight:600">$8,400</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right">$13,500</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right">$20,000</td></tr><tr style="background:#F8F8F8"><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px">Active clients</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right;font-weight:600">6</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right">10</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right">15</td></tr><tr><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px">Gross margin</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right;font-weight:600">82%</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right">80%</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right">78%</td></tr><tr style="background:#F8F8F8"><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px">Client retention</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right;font-weight:600">94%</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right">92%</td><td style="padding:10px;border:1px solid #E2E4E9;font-size:14px;text-align:right">90%</td></tr></table></body></html>`,
    },
  });

  // Integrations (all connected for demo)
  const intgData = [
    { provider: "stripe",  status: "connected", metadata: JSON.stringify({ accountId: "acct_demo_stripe", mrr: 8400 }) },
    { provider: "google",  status: "connected", metadata: JSON.stringify({ businessName: "LocalPulse Media", rating: 4.9, reviews: 31 }) },
    { provider: "calendly",status: "connected", metadata: JSON.stringify({ url: "calendly.com/localpulsemedia", bookings_this_month: 5 }) },
    { provider: "instagram",status:"connected", metadata: JSON.stringify({ handle: "@localpulsemedia", followers: 1240 }) },
  ];
  for (const ig of intgData) {
    await prisma.integration.create({ data: { businessId: business.id, ...ig } });
  }

  console.log("[Seed] Demo account created successfully.");
  console.log("[Seed] Login: jo@launchlab.demo / 12345678");
}

module.exports = { seed };
if (require.main === module) seed().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
