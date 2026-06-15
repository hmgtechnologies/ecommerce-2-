#!/usr/bin/env node
/* ============================================================================
 * HMG StoreForge — Node.js CLI Generator
 * ----------------------------------------------------------------------------
 * Generate a ready-to-deploy store from a JSON config file, without a browser.
 *
 * USAGE:
 *   node generate.js path/to/client.json [outputDir]
 *
 * Example client.json is created if you run:  node generate.js --init
 * Requires Node 14+ (no external npm packages).
 * ==========================================================================*/

const fs = require("fs");
const path = require("path");

// Resolve store-template relative to this script: cli/ -> generator/ -> e-commerce/store-template
const TEMPLATE_DIR = path.resolve(__dirname, "..", "..", "store-template");

const SAMPLE = {
  storeId: "bellas-fashion",
  storeName: "Bella's Fashion Hub",
  tagline: "Quality fashion at honest prices.",
  about: "Bella's Fashion Hub brings you the latest styles with reliable delivery nationwide.",
  location: "Lagos, Nigeria",
  announcement: "🎉 Free delivery on orders above ₦50,000!",
  whatsapp: "2348012345678",
  phoneDisplay: "+234 801 234 5678",
  email: "hello@bellasfashion.com",
  social: { instagram: "https://instagram.com/bellasfashion", facebook: "", tiktok: "", youtube: "" },
  theme: { primary: "#0f2a4a", accent: "#c9a227", accent2: "#14857c" },
  payments: {
    manual: { enabled: true, bank: "GTBank", accountNumber: "0123456789", accountName: "Bella Fashion Ltd" },
    gateway: { enabled: false, provider: "Paystack", paymentLink: "" }
  },
  supabase: { url: "", anonKey: "" },
  adminPass: "admin1234",
  // v2 enterprise options
  coupons: [
    { code: "WELCOME10", type: "percent", value: 10, minTotal: 0 }
  ],
  delivery: {
    freeAbove: 50000,
    zones: [
      { name: "Lagos Mainland", fee: 1500 },
      { name: "Lagos Island", fee: 2500 },
      { name: "Outside Lagos", fee: 4000 }
    ]
  },
  newsletter: { formspreeId: "" },
  analytics: { cloudflareToken: "", googleId: "" },
  // v3 enterprise options
  hours: { enabled: true, timezone: "Africa/Lagos",
    schedule: { mon:["08:00","20:00"], tue:["08:00","20:00"], wed:["08:00","20:00"],
                thu:["08:00","20:00"], fri:["08:00","21:00"], sat:["09:00","21:00"], sun:["12:00","18:00"] } },
  faq: [
    { q: "How do I place an order?", a: "Add items to cart, checkout, choose a payment method — your order reaches us on WhatsApp." },
    { q: "What are the delivery fees?", a: "Fees depend on your zone. Free delivery above the threshold set by the store." }
  ],
  testimonials: [
    { name: "Happy Customer", text: "Great service and fast delivery!", rating: 5 }
  ],
  currencies: { base: "NGN", rates: { NGN: 1, USD: 0.00067, GBP: 0.00053 }, symbols: { NGN: "₦", USD: "$", GBP: "£" } },
  returnsPolicy: "We accept returns within 48 hours of delivery for unused items in original packaging. Contact us on WhatsApp to start a return.",
  // v4 enterprise options
  orders: { sheetsWebAppUrl: "", alsoEmailFormspreeId: "" },
  loyalty: { enabled: false, pointsPerNaira: 0.001 },
  flashSale: { enabled: false, title: "Flash Sale!", endsAt: "" },
  socialProof: { enabled: false },
  trustBadges: [],
  languages: { enabled: true, default: "en", list: ["en","pcm","ha","yo","ig"] },
  // v5 enterprise options
  marketplace: { enabled: false, commissionPercent: 0, vendors: [] },
  giftCards: [],
  referral: { enabled: false, rewardText: "Share your link — earn store credit when friends buy!" },
  // v6 enterprise options
  notifications: { enabled: false },
  qr: { enabled: true },
  salesTarget: { enabled: false, monthly: 0 },
  dispatch: { riders: [] },
  dispatchPass: "dispatch123",
  // v7 enterprise options
  accounts: { enabled: true },
  subscriptions: { enabled: true },
  ledger: { commissionPercent: 8 },
  // v9 design + features + recovery (edit per client)
  design: { font: "system", headingFont: "system", layout: "classic", hero: "split",
    cardStyle: "shadow", uiStyle: "standard", radius: "soft", buttonShape: "rounded", density: "cozy", darkDefault: false },
  features: { search: true, categories: true, wishlist: true, reviews: true, qa: true, testimonials: true,
    faq: true, vendors: true, newsletter: true, recentlyViewed: true, trustBadges: true, about: true,
    contact: true, darkMode: true, languages: true, loyalty: true, accounts: true, notifications: true },
  recovery: { enabled: false, formspreeId: "", delayMinutes: 60, coupon: "COMEBACK10", couponHint: "a discount" }
};

/* Your HMG brand for lead generation (mirrors generator/assets/js/brand.js) */
var HMG_LEADGEN = {
  company: "HMG Technologies", founder: "Adewale Samson Adeagbo",
  site: "https://hmgtechnologies.pages.dev", whatsapp: "2348100866322",
  email: "hmgconcepts@gmail.com", badge: true
};

function init() {
  fs.writeFileSync("client.sample.json", JSON.stringify(SAMPLE, null, 2));
  console.log("✅ Created client.sample.json — edit it, then run: node generate.js client.sample.json");
}

function buildConfig(d) {
  const cfg = {
    storeId: d.storeId, storeName: d.storeName, tagline: d.tagline || "",
    about: d.about || `Welcome to ${d.storeName}.`, location: d.location || "Nigeria",
    storeUrl: `https://${d.storeId}.pages.dev`, announcement: d.announcement || "", currencySymbol: "₦",
    whatsapp: (d.whatsapp || "").replace(/\D/g, ""), whatsappDisplay: "+" + (d.whatsapp || ""),
    phone: (d.whatsapp || "").replace(/\D/g, ""), phoneDisplay: d.phoneDisplay || ("+" + d.whatsapp), email: d.email || "",
    social: d.social || {}, theme: { ...{ primary: "#0f2a4a", accent: "#c9a227", accent2: "#14857c", dark: "#0a1929" }, ...(d.theme || {}) },
    payments: d.payments || { manual: { enabled: true }, gateway: { enabled: false } },
    supabase: { url: (d.supabase || {}).url || "", anonKey: (d.supabase || {}).anonKey || "", table: "products" },
    // v2 enterprise options
    coupons: d.coupons || [],
    delivery: d.delivery || { freeAbove: 0, zones: [] },
    newsletter: d.newsletter || { formspreeId: "" },
    analytics: d.analytics || { cloudflareToken: "", googleId: "" },
    // v3 enterprise options
    hours: d.hours || { enabled: false },
    faq: d.faq || [],
    testimonials: d.testimonials || [],
    currencies: d.currencies || null,
    returnsPolicy: d.returnsPolicy || "",
    // v4 enterprise options
    orders: d.orders || { sheetsWebAppUrl: "", alsoEmailFormspreeId: "" },
    loyalty: d.loyalty || { enabled: false, pointsPerNaira: 0.001 },
    flashSale: d.flashSale || { enabled: false, title: "Flash Sale!", endsAt: "" },
    socialProof: d.socialProof || { enabled: false },
    trustBadges: d.trustBadges || [],
    languages: d.languages || { enabled: true, default: "en", list: ["en","pcm","ha","yo","ig"] },
    // v5 enterprise options
    marketplace: d.marketplace || { enabled: false, commissionPercent: 0, vendors: [] },
    giftCards: d.giftCards || [],
    referral: d.referral || { enabled: false, rewardText: "Share your link — earn store credit when friends buy!" },
    // v6 enterprise options
    notifications: d.notifications || { enabled: false },
    qr: d.qr || { enabled: true },
    salesTarget: d.salesTarget || { enabled: false, monthly: 0 },
    dispatch: d.dispatch || { riders: [] },
    // v7 enterprise options
    accounts: d.accounts || { enabled: true },
    subscriptions: d.subscriptions || { enabled: true },
    ledger: d.ledger || { commissionPercent: 0 },
    // v9 design + features + recovery + lead generation
    design: d.design || { font: "system", layout: "classic", hero: "split", cardStyle: "shadow", uiStyle: "standard", radius: "soft", buttonShape: "rounded", density: "cozy" },
    features: d.features || {},
    recovery: d.recovery || { enabled: false },
    leadGen: d.leadGen || HMG_LEADGEN
  };
  return `/* Auto-generated by HMG StoreForge v9 CLI for ${d.storeName} */\nwindow.STORE_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;
}

function readme(d) {
  return `# ${d.storeName} — Online Store\n\nBuilt with HMG StoreForge (CLI) by HMG Technologies.\n\n` +
    `## Deploy (free)\n1. Create a GitHub repo named \`${d.storeId}\`.\n2. Upload all files here.\n` +
    `3. Cloudflare Pages or GitHub Pages → deploy. Live at https://${d.storeId}.pages.dev\n\n` +
    `## Add products\nOpen admin.html (passcode: ${d.adminPass || "admin1234"}). Paste Google Drive image links, ` +
    `download products.json, upload to GitHub.\n\n💬 HMG support: https://wa.me/2348100866322\n` +
    `⚡ Powered by HMG StoreForge\n`;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), t = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, t);
    else fs.copyFileSync(s, t);
  }
}

function main() {
  const arg = process.argv[2];
  if (!arg || arg === "--help" || arg === "-h") {
    console.log("HMG StoreForge CLI\n  node generate.js --init           create sample config\n  node generate.js client.json [out]  generate store");
    return;
  }
  if (arg === "--init") return init();

  const d = JSON.parse(fs.readFileSync(arg, "utf8"));
  if (!d.storeId || !d.storeName || !d.whatsapp) {
    console.error("❌ client.json must include storeId, storeName and whatsapp."); process.exit(1);
  }
  const out = process.argv[3] || path.join("dist", d.storeId);

  // 1) Copy the entire store template
  copyDir(TEMPLATE_DIR, out);
  // 2) Overwrite generated files
  fs.writeFileSync(path.join(out, "assets/js/config.js"), buildConfig(d));
  fs.writeFileSync(path.join(out, "README.md"), readme(d));
  // 3) Set admin passcode
  const adminPath = path.join(out, "admin.html");
  let admin = fs.readFileSync(adminPath, "utf8");
  admin = admin.replace('const ADMIN_PASS = "admin1234";', `const ADMIN_PASS = ${JSON.stringify(d.adminPass || "admin1234")};`);
  fs.writeFileSync(adminPath, admin);
  // v6: set dispatch passcode
  const dispatchPath = path.join(out, "dispatch.html");
  if (fs.existsSync(dispatchPath)) {
    let disp = fs.readFileSync(dispatchPath, "utf8");
    disp = disp.replace('const DISPATCH_PASS = "dispatch123";', `const DISPATCH_PASS = ${JSON.stringify(d.dispatchPass || "dispatch123")};`);
    fs.writeFileSync(dispatchPath, disp);
  }
  // 4) SEO helpers
  const base = `https://${d.storeId}.pages.dev`;
  fs.writeFileSync(path.join(out, "robots.txt"),
    `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /vendor.html\nDisallow: /dispatch.html\nDisallow: /ledger.html\nSitemap: ${base}/sitemap.xml\n`);
  // v8: SEO sitemap (public pages only)
  const today = new Date().toISOString().slice(0, 10);
  const pages = ["/", "/track.html", "/vendor-apply.html"];
  fs.writeFileSync(path.join(out, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages.map(p => `  <url><loc>${base}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${p === "/" ? "1.0" : "0.6"}</priority></url>`).join("\n") +
    `\n</urlset>\n`);
  fs.writeFileSync(path.join(out, "_redirects"), "/*  /index.html  200\n");

  console.log(`✅ Store generated at: ${out}`);
  console.log(`   → Upload its contents to a GitHub repo named "${d.storeId}" and deploy on Cloudflare Pages.`);
  console.log(`   → Live URL: https://${d.storeId}.pages.dev`);
}

main();
