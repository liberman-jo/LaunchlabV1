const router      = require("express").Router();
const express     = require("express");
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw Object.assign(new Error("Stripe not configured — add STRIPE_SECRET_KEY to environment variables"), {status:503});
  return require("stripe")(process.env.STRIPE_SECRET_KEY);
}

const PLANS = {
  starter: { name:"Starter", price:15, features:["AI idea generation & vetting","1 active business","Market research reports","Startup cost analysis"] },
  growth:  { name:"Growth",  price:25, features:["Everything in Starter","Unlimited businesses","Management reports","Marketing performance reports","Weekly AI insights"] },
  pro:     { name:"Pro",     price:35, features:["Everything in Growth","AI insights from all reports","Competitive intelligence","Revenue optimization","Priority support"] },
};
const ADDONS = {
  auto_management:    { name:"Automated Management",         price:10, desc:"AI surfaces daily operational action items from your reports" },
  auto_marketing:     { name:"Automated Marketing",          price:10, desc:"AI generates and schedules content based on performance data" },
  premium_management: { name:"Premium Automated Management", price:20, desc:"Fully autonomous operations — bookings, replies, escalations handled" },
  premium_marketing:  { name:"Premium Automated Marketing",  price:20, desc:"Fully autonomous marketing — campaigns, spend, and A/B tests run automatically" },
};

router.get("/plans", (req, res) => res.json({ plans: PLANS, addons: ADDONS }));

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({ where: { userId: req.userId } });
    res.json({ subscription: sub || { plan:"free", status:"active", addons:"[]" } });
  } catch(e) { next(e); }
});

router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const stripe  = getStripe();
    const { plan, addons=[], priceIds={} } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error:"Invalid plan" });
    const user = await prisma.user.findUnique({ where:{ id:req.userId } });
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email:user.email, name:user.name });
      customerId = customer.id;
      await prisma.user.update({ where:{ id:req.userId }, data:{ stripeCustomerId:customerId } });
    }
    const lineItems = [];
    if (priceIds[plan]) lineItems.push({ price:priceIds[plan], quantity:1 });
    addons.forEach(a => { if (priceIds[a]) lineItems.push({ price:priceIds[a], quantity:1 }); });
    if (lineItems.length === 0) return res.status(400).json({ error:"No Stripe price IDs configured. Add STRIPE_PRICE_* to env." });

    const session = await stripe.checkout.sessions.create({
      customer: customerId, mode:"subscription", payment_method_types:["card"],
      line_items: lineItems,
      success_url: `${process.env.CLIENT_URL}/dashboard?plan=${plan}`,
      cancel_url:  `${process.env.CLIENT_URL}/pricing`,
      metadata: { userId:req.userId, plan, addons:JSON.stringify(addons) },
    });
    res.json({ url:session.url });
  } catch(e) { next(e); }
});

router.post("/portal", requireAuth, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const user   = await prisma.user.findUnique({ where:{ id:req.userId } });
    if (!user.stripeCustomerId) return res.status(400).json({ error:"No billing account found" });
    const session = await stripe.billingPortal.sessions.create({ customer:user.stripeCustomerId, return_url:`${process.env.CLIENT_URL}/dashboard` });
    res.json({ url:session.url });
  } catch(e) { next(e); }
});

router.post("/webhook", express.raw({ type:"application/json" }), async (req, res) => {
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch { return res.status(400).send("Webhook error"); }
  if (event.type === "checkout.session.completed") {
    const { userId, plan, addons } = event.data.object.metadata;
    await prisma.subscription.upsert({
      where:  { userId }, update: { plan, status:"active", addons, stripeSubscriptionId:event.data.object.subscription },
      create: { userId, plan, status:"active", addons, stripeSubscriptionId:event.data.object.subscription },
    }).catch(console.error);
  }
  if (event.type === "customer.subscription.deleted") {
    const sub = await prisma.subscription.findFirst({ where:{ stripeSubscriptionId:event.data.object.id } });
    if (sub) await prisma.subscription.update({ where:{ id:sub.id }, data:{ plan:"free", status:"canceled" } });
  }
  res.json({ received:true });
});

module.exports = router;
