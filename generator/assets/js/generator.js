/* ============================================================================
 * HMG StoreForge — Generator Engine (generator.js)
 * ----------------------------------------------------------------------------
 * Reads client details from the form, builds config.js, customises admin.html
 * passcode, packages the full store template + assets into a downloadable ZIP,
 * and embeds HMG lead-generation branding. Falls back to per-file download if
 * JSZip (CDN) is unavailable.
 * ==========================================================================*/

(function () {
  const $ = s => document.querySelector(s);
  const form = $("#genForm");
  const T = window.SF_TEMPLATES || {};
  const B = window.SF_BINARIES || {};

  /* ---- Populate HMG lead-gen sidebar from brand.js ---- */
  function fillBrand() {
    const L = HMG_BRAND.links;
    $("#hdrWa").href = hmgWhatsAppLink("Hi! I'm using HMG StoreForge and need help.");
    $("#sideWa").href = hmgWhatsAppLink("Hi HMG! I want to discuss building stores with StoreForge.");
    $("#footTech").href = L.technologies;
    $("#hmgLinks").innerHTML = [
      ["🌐 HMG Concepts", L.concepts], ["💻 HMG Technologies", L.technologies],
      ["🎓 HMG Academy", L.academy], ["📢 HMG Media", L.media],
      ["✝️ HMG Gospel", L.gospel], ["👤 Portfolio", L.portfolio]
    ].map(([t, u]) => `<li><a href="${u}" target="_blank">${t}</a></li>`).join("");
    $("#footLinks").innerHTML = Object.entries(L)
      .map(([k, u]) => `<a href="${u}" target="_blank">${k}</a>`).join("");
  }

  /* ---- Live preview ---- */
  const FONT_STACKS = {
    system: "system-ui,sans-serif", inter: "'Inter',sans-serif", poppins: "'Poppins',sans-serif",
    montserrat: "'Montserrat',sans-serif", nunito: "'Nunito',sans-serif", lora: "'Lora',serif",
    playfair: "'Playfair Display',serif", spacegrotesk: "'Space Grotesk',sans-serif"
  };
  const RADII = { sharp: "2px", soft: "10px", rounded: "16px", pill: "22px" };
  let _fontLinkAdded = {};
  function ensurePreviewFont(key) {
    const g = { inter: "Inter:wght@400;700", poppins: "Poppins:wght@400;700", montserrat: "Montserrat:wght@400;700",
      nunito: "Nunito:wght@400;700", lora: "Lora:wght@400;700", playfair: "Playfair+Display:wght@500;700",
      spacegrotesk: "Space+Grotesk:wght@400;700" }[key];
    if (g && !_fontLinkAdded[key]) { const l = document.createElement("link"); l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=" + g + "&display=swap"; document.head.appendChild(l); _fontLinkAdded[key] = true; }
  }

  function updatePreview() {
    const d = data();
    const mp = $("#miniPreview");
    $("#msName").textContent = d.storeName || "Store Name";
    $("#msTag").textContent = d.tagline || "Your tagline appears here";
    $("#msBar").textContent = d.storeName || "Your Store";
    $("#msHero").style.background = (d.hero === "none") ? "var(--border)"
      : `linear-gradient(135deg,${d.primary},${d.accent2})`;
    $("#msBar").style.background = d.primary;
    $("#msAccent1").style.color = d.accent2;
    $("#msAccent2").style.color = d.accent2;
    // fonts
    ensurePreviewFont(d.font); ensurePreviewFont(d.headingFont);
    mp.style.fontFamily = FONT_STACKS[d.font] || FONT_STACKS.system;
    $("#msName").style.fontFamily = FONT_STACKS[d.headingFont] || FONT_STACKS[d.font] || FONT_STACKS.system;
    // radius + card style on preview cards
    const r = RADII[d.radius] || "10px";
    $$(".ms-card", mp).forEach(c => {
      c.style.borderRadius = r;
      c.style.boxShadow = d.cardStyle === "shadow" ? "0 4px 12px rgba(0,0,0,.12)" : "none";
      c.style.border = (d.cardStyle === "border") ? "1px solid #ccc" : (d.cardStyle === "flat" ? "none" : c.style.border);
    });
    // hero text alignment
    $("#msHero").style.textAlign = (d.hero === "centered" || d.hero === "banner") ? "center" : "left";
    // dark default preview
    mp.style.filter = d.darkDefault ? "none" : "none";
    $("#msStyleTag") && ($("#msStyleTag").textContent = `${d.layout} · ${d.uiStyle} · ${d.font}`);
  }

  function data() {
    const f = new FormData(form), g = k => (f.get(k) || "").toString().trim();
    return {
      storeName: g("storeName"), tagline: g("tagline"), about: g("about"),
      location: g("location") || "Nigeria", storeId: g("storeId") || "my-store",
      announcement: g("announcement"), whatsapp: g("whatsapp").replace(/\D/g, ""),
      phoneDisplay: g("phoneDisplay"), email: g("email"),
      instagram: g("instagram"), facebook: g("facebook"), tiktok: g("tiktok"), youtube: g("youtube"),
      primary: g("primary") || "#0f2a4a", accent: g("accent") || "#c9a227", accent2: g("accent2") || "#14857c",
      manualEnabled: f.get("manualEnabled") === "on", bank: g("bank"),
      accountNumber: g("accountNumber"), accountName: g("accountName"),
      gatewayEnabled: f.get("gatewayEnabled") === "on", provider: g("provider") || "Paystack", paymentLink: g("paymentLink"),
      supabaseUrl: g("supabaseUrl"), supabaseKey: g("supabaseKey"), adminPass: g("adminPass") || "admin1234",
      // v2 fields
      freeAbove: parseInt(g("freeAbove")) || 0,
      zonesRaw: g("zones"),       // "Name:fee, Name:fee"
      couponsRaw: g("coupons"),   // "CODE:percent:10, CODE2:fixed:2000"
      formspreeId: g("formspreeId"),
      cloudflareToken: g("cloudflareToken"), googleId: g("googleId"),
      // v4 fields
      sheetsWebAppUrl: g("sheetsWebAppUrl"),
      loyaltyEnabled: f.get("loyaltyEnabled") === "on",
      flashTitle: g("flashTitle"), flashEndsAt: g("flashEndsAt"),
      socialProofEnabled: f.get("socialProofEnabled") === "on",
      languagesEnabled: f.get("languagesEnabled") === "on",
      returnsPolicy: g("returnsPolicy"), estimatedDays: parseInt(g("estimatedDays")) || 3,
      // v5 fields
      marketplaceEnabled: f.get("marketplaceEnabled") === "on",
      vendorsRaw: g("vendors"),            // "Name|whatsapp|location; Name|whatsapp|location"
      giftCardsRaw: g("giftCards"),        // "CODE:5000, CODE2:2000"
      referralEnabled: f.get("referralEnabled") === "on",
      // v6 fields
      notificationsEnabled: f.get("notificationsEnabled") === "on",
      salesTarget: parseInt(g("salesTarget")) || 0,
      ridersRaw: g("riders"),              // "Name|phone; Name|phone"
      dispatchPass: g("dispatchPass") || "dispatch123",
      // v7 fields
      accountsEnabled: f.get("accountsEnabled") === "on",
      subscriptionsEnabled: f.get("subscriptionsEnabled") === "on",
      commissionPercent: parseFloat(g("commissionPercent")) || 0,
      // v9 design fields
      font: g("font") || "system", headingFont: g("headingFont") || g("font") || "system",
      layout: g("layout") || "classic", hero: g("hero") || "split",
      cardStyle: g("cardStyle") || "shadow", uiStyle: g("uiStyle") || "standard",
      radius: g("radius") || "soft", buttonShape: g("buttonShape") || "rounded",
      density: g("density") || "cozy", darkDefault: f.get("darkDefault") === "on",
      // v9 feature toggles (checkbox checked = on). default on if absent.
      featToggles: {
        wishlist: f.get("feat_wishlist") === "on", reviews: f.get("feat_reviews") === "on",
        qa: f.get("feat_qa") === "on", testimonials: f.get("feat_testimonials") === "on",
        faq: f.get("feat_faq") === "on", newsletter: f.get("feat_newsletter") === "on",
        recentlyViewed: f.get("feat_recent") === "on", trustBadges: f.get("feat_trust") === "on",
        darkMode: f.get("feat_dark") === "on", loyalty: f.get("feat_loyalty") === "on",
        accounts: f.get("feat_accounts") === "on", notifications: f.get("feat_notif") === "on"
      },
      // v9 recovery
      recoveryEnabled: f.get("recoveryEnabled") === "on", recoveryFormspree: g("recoveryFormspree"),
      recoveryCoupon: g("recoveryCoupon")
    };
  }

  function parseRiders(raw) {
    if (!raw) return [];
    return raw.split(";").map(r => { const [name, phone] = r.split("|").map(s => (s || "").trim()); return name ? { name, phone: (phone || "").replace(/\D/g, "") } : null; }).filter(Boolean);
  }

  /* ---- Parse v5 free-text fields ---- */
  function parseVendors(raw) {
    if (!raw) return [];
    return raw.split(";").map((v, i) => {
      const [name, wa, loc] = v.split("|").map(s => (s || "").trim());
      return name ? { id: "v" + (i + 1), name, whatsapp: (wa || "").replace(/\D/g, ""), location: loc || "", rating: 5, logo: "" } : null;
    }).filter(Boolean);
  }
  function parseGiftCards(raw) {
    if (!raw) return [];
    return raw.split(",").map(c => { const [code, val] = c.split(":"); return code ? { code: code.trim().toUpperCase(), value: parseFloat(val) || 0 } : null; }).filter(Boolean);
  }

  /* ---- Parse v2 free-text fields ---- */
  function parseZones(raw) {
    if (!raw) return [];
    return raw.split(",").map(z => { const [name, fee] = z.split(":"); return name ? { name: name.trim(), fee: parseInt(fee) || 0 } : null; }).filter(Boolean);
  }
  function parseCoupons(raw) {
    if (!raw) return [];
    return raw.split(",").map(c => {
      const [code, type, value, minTotal] = c.split(":");
      return code ? { code: code.trim().toUpperCase(), type: (type || "percent").trim(), value: parseFloat(value) || 0, minTotal: parseFloat(minTotal) || 0 } : null;
    }).filter(Boolean);
  }

  /* ---- Build config.js content ---- */
  function buildConfig(d) {
    const cfg = {
      storeId: d.storeId, storeName: d.storeName, tagline: d.tagline,
      about: d.about || `Welcome to ${d.storeName}. Quality products and great service.`,
      location: d.location, storeUrl: `https://${d.storeId}.pages.dev`,
      announcement: d.announcement, currencySymbol: "₦",
      whatsapp: d.whatsapp, whatsappDisplay: "+" + d.whatsapp,
      phone: d.whatsapp, phoneDisplay: d.phoneDisplay || "+" + d.whatsapp, email: d.email,
      social: { facebook: d.facebook, instagram: d.instagram, tiktok: d.tiktok, youtube: d.youtube,
                whatsapp: d.whatsapp ? "https://wa.me/" + d.whatsapp : "" },
      theme: { primary: d.primary, accent: d.accent, accent2: d.accent2, dark: "#0a1929" },
      payments: {
        manual: { enabled: d.manualEnabled, bank: d.bank, accountNumber: d.accountNumber, accountName: d.accountName },
        gateway: { enabled: d.gatewayEnabled, provider: d.provider, paymentLink: d.paymentLink }
      },
      supabase: { url: d.supabaseUrl, anonKey: d.supabaseKey, table: "products" },
      // v2 enterprise options
      coupons: parseCoupons(d.couponsRaw),
      delivery: { freeAbove: d.freeAbove, estimatedDays: d.estimatedDays, zones: parseZones(d.zonesRaw) },
      newsletter: { formspreeId: d.formspreeId },
      analytics: { cloudflareToken: d.cloudflareToken, googleId: d.googleId },
      // v3 options
      returnsPolicy: d.returnsPolicy || "We accept returns within 48 hours of delivery for unused items. Contact us on WhatsApp.",
      // v4 enterprise options
      orders: { sheetsWebAppUrl: d.sheetsWebAppUrl, alsoEmailFormspreeId: d.formspreeId },
      loyalty: { enabled: d.loyaltyEnabled, pointsPerNaira: 0.001 },
      flashSale: { enabled: !!(d.flashEndsAt), title: d.flashTitle || "Flash Sale!", endsAt: d.flashEndsAt || "" },
      socialProof: { enabled: d.socialProofEnabled },
      languages: { enabled: d.languagesEnabled, default: "en", list: ["en", "pcm", "ha", "yo", "ig"] },
      // v5 enterprise options
      marketplace: { enabled: d.marketplaceEnabled, commissionPercent: 0, vendors: parseVendors(d.vendorsRaw) },
      giftCards: parseGiftCards(d.giftCardsRaw),
      referral: { enabled: d.referralEnabled, rewardText: "Share your link — earn store credit when friends buy!" },
      // v6 enterprise options
      notifications: { enabled: d.notificationsEnabled },
      qr: { enabled: true },
      salesTarget: { enabled: d.salesTarget > 0, monthly: d.salesTarget },
      dispatch: { riders: parseRiders(d.ridersRaw) },
      // v7 enterprise options
      accounts: { enabled: d.accountsEnabled },
      subscriptions: { enabled: d.subscriptionsEnabled },
      ledger: { commissionPercent: d.commissionPercent },
      // v9 design + features + recovery
      design: {
        font: d.font, headingFont: d.headingFont, layout: d.layout, hero: d.hero,
        cardStyle: d.cardStyle, uiStyle: d.uiStyle, radius: d.radius,
        buttonShape: d.buttonShape, density: d.density, darkDefault: d.darkDefault
      },
      features: d.featToggles,
      recovery: { enabled: d.recoveryEnabled, formspreeId: d.recoveryFormspree, delayMinutes: 60,
        coupon: d.recoveryCoupon || "COMEBACK10", couponHint: "a discount" },
      // v9 LEAD GENERATION — YOUR brand embedded on every client store
      leadGen: {
        company: HMG_BRAND.company, founder: HMG_BRAND.founder,
        site: HMG_BRAND.links.technologies, whatsapp: HMG_BRAND.whatsapp,
        email: HMG_BRAND.email, badge: true
      }
    };
    return "/* Auto-generated by HMG StoreForge v9 for " + d.storeName + " */\n" +
           "window.STORE_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
  }

  /* ---- Build README for the client's repo ---- */
  function buildReadme(d) {
    return `# ${d.storeName} — Online Store

Built with **HMG StoreForge v9** by HMG Technologies.

### ✨ This store includes: wishlist, reviews, variants, coupons, delivery zones,
order tracking, PWA, bulk CSV, sales dashboard, multi-currency, Google Sheets logging, loyalty,
flash sale, social proof, comparison, trust badges, multi-vendor marketplace, gift cards, referrals,
**vendor self-service dashboard**, **dispatch/rider assignment**, **push notifications**, **store QR
code**, and **sales targets** — all free. (Original line continues:)
### ✨ wishlist, reviews & ratings, image galleries, variants,
coupon codes, delivery-zone fees, order tracking, PWA (installable + offline), newsletter,
abandoned-cart nudge, bulk CSV, sales dashboard, order management, store hours, FAQ,
testimonials, multi-currency, printable receipts, customer memory, **Google Sheets order
logging**, **loyalty points**, **flash-sale countdown**, **trust badges**, **product
comparison**, **back-in-stock alerts**, and **English/Pidgin switcher** — all free.

## 🚀 Quick Deploy (free)
1. Create a free GitHub account → new repository named \`${d.storeId}\`.
2. Upload ALL files in this folder (keep the folder structure).
3. Go to https://dash.cloudflare.com → Pages → "Connect to Git" → select this repo → Deploy.
   (Or use GitHub Pages: repo Settings → Pages → Branch: main → /root.)
4. Your store will be live at \`https://${d.storeId}.pages.dev\` in ~1 minute.

## 🛍️ Add Products
- Open \`admin.html\` in your browser (passcode: **${d.adminPass}**).
- Paste a Google Drive image link, add name/price/description, Save.
- Click **Download products.json** and upload it to your repo (replace the old one).
- Or, if Supabase is configured, click **Sync to Supabase** for instant updates.

## 💬 Need changes or a custom feature?
Chat with HMG Technologies on WhatsApp: https://wa.me/${HMG_BRAND.whatsapp}

⚡ Powered by HMG StoreForge — https://hmgtechnologies.pages.dev
`;
  }

  /* ---- Build admin.html with the chosen passcode ---- */
  function buildAdmin(d) {
    return (T["admin.html"] || "").replace('const ADMIN_PASS = "admin1234";',
      'const ADMIN_PASS = ' + JSON.stringify(d.adminPass) + ';');
  }

  /* ---- Supporting files ---- */
  function buildExtras(d) {
    return {
      "robots.txt": `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /vendor.html\nDisallow: /dispatch.html\nDisallow: /ledger.html\nSitemap: https://${d.storeId}.pages.dev/sitemap.xml\n`,
      "sitemap.xml": (() => {
        const base = `https://${d.storeId}.pages.dev`;
        const today = new Date().toISOString().slice(0, 10);
        // Only PUBLIC pages (admin/vendor/dispatch/ledger are excluded from search)
        const pages = ["/", "/track.html", "/vendor-apply.html"];
        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          pages.map(p => `  <url><loc>${base}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${p === "/" ? "1.0" : "0.6"}</priority></url>`).join("\n") +
          `\n</urlset>\n`;
      })(),
      "_redirects": "/*  /index.html  200\n",
      ".gitignore": "node_modules/\n.DS_Store\n*.log\n"
    };
  }

  /* ---- Build the complete file set (shared by ZIP + GitHub deploy) ---- */
  function buildAllFiles(d) {
    const files = {};
    // Include EVERY text template (so all v2/v3 files are packaged automatically)
    Object.entries(T).forEach(([path, content]) => { files[path] = content; });
    // Override the generated/customised files
    files["admin.html"] = buildAdmin(d);
    // v6: set the dispatch passcode
    if (files["dispatch.html"]) {
      files["dispatch.html"] = files["dispatch.html"].replace('const DISPATCH_PASS = "dispatch123";',
        'const DISPATCH_PASS = ' + JSON.stringify(d.dispatchPass || "dispatch123") + ';');
    }
    files["assets/js/config.js"] = buildConfig(d);
    files["README.md"] = buildReadme(d);
    Object.assign(files, buildExtras(d));
    return files;
  }

  /* ---- Generate & download ZIP ---- */
  async function generate() {
    const d = data();
    if (!d.storeName || !d.storeId || !d.whatsapp) {
      status("⚠️ Please fill Store name, Store ID and WhatsApp number.", true); return;
    }
    $("#generateBtn").disabled = true; status("⚙️ Building store files…");

    const files = buildAllFiles(d);

    if (!window.JSZip) {
      status("⚠️ ZIP library blocked. Downloading config.js only — copy other files manually.", true);
      download("config.js", buildConfig(d)); $("#generateBtn").disabled = false; return;
    }

    const zip = new JSZip();
    Object.entries(files).forEach(([p, c]) => zip.file(p, c));
    // binary assets
    Object.entries(B).forEach(([p, b64]) => zip.file(p, b64, { base64: true }));

    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${d.storeId}-storeforge.zip`;
    a.click();
    status(`✅ Done! Downloaded "${d.storeId}-storeforge.zip". Unzip and upload to GitHub. See README inside.`);
    $("#generateBtn").disabled = false;
  }

  function download(name, content) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = name; a.click();
  }
  function status(msg, warn) { const s = $("#status"); s.textContent = msg; s.style.color = warn ? "#b3261e" : "var(--accent2)"; }

  /* ---- v3: One-click deploy to GitHub ---- */
  function deployLog(html, isErr) {
    const box = $("#deployLog"); box.hidden = false;
    const line = document.createElement("div");
    if (isErr) line.className = "err";
    line.innerHTML = html;
    box.appendChild(line); box.scrollTop = box.scrollHeight;
  }

  async function deployToGitHub() {
    const d = data();
    const token = $("#ghToken").value.trim();
    if (!d.storeName || !d.storeId || !d.whatsapp) { status("⚠️ Fill Store name, Store ID and WhatsApp first.", true); return; }
    if (!token) { status("⚠️ Paste a GitHub token to deploy.", true); return; }
    if (!window.GitHubDeploy) { status("⚠️ Deploy module not loaded.", true); return; }

    $("#deployBtn").disabled = true;
    $("#deployLog").hidden = false; $("#deployLog").innerHTML = "";
    deployLog("⚙️ Building store files…");

    const files = buildAllFiles(d);

    try {
      const result = await GitHubDeploy.deploy({
        token, repo: d.storeId,
        description: `${d.storeName} — online store built with HMG StoreForge`,
        isPrivate: $("#ghPrivate").checked,
        files, binaries: B,
        onLog: (m) => deployLog(m.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>'))
      });
      deployLog(`✅ <strong>Live store:</strong> <a href="${result.pagesUrl}" target="_blank">${result.pagesUrl}</a>`);
      deployLog(`📂 <strong>Repository:</strong> <a href="${result.repoUrl}" target="_blank">${result.repoUrl}</a>`);
      deployLog(`🔐 Admin: ${result.pagesUrl}admin.html (passcode: ${d.adminPass})`);
      status("🎉 Deployed to GitHub! Live link is in the log below (allow 1–2 min).");
    } catch (e) {
      deployLog("❌ " + e.message, true);
      status("Deploy failed: " + e.message, true);
    } finally {
      $("#deployBtn").disabled = false;
    }
  }

  /* ---- v9: Colour presets ---- */
  function renderPresets() {
    const wrap = $("#colorPresets"); if (!wrap) return;
    const presets = [
      ["HMG (default)", "#0f2a4a", "#c9a227", "#14857c"],
      ["Emerald", "#064e3b", "#10b981", "#34d399"],
      ["Royal", "#1e1b4b", "#6366f1", "#a78bfa"],
      ["Sunset", "#7c2d12", "#f97316", "#fb923c"],
      ["Rose", "#831843", "#ec4899", "#f9a8d4"],
      ["Mono", "#111827", "#374151", "#6b7280"],
      ["Ocean", "#0c4a6e", "#0ea5e9", "#38bdf8"],
      ["Naija", "#055e3b", "#16a34a", "#facc15"]
    ];
    wrap.innerHTML = presets.map((p, i) =>
      `<button type="button" class="preset" data-p="${i}"><span class="sw" style="background:${p[1]}"></span><span class="sw" style="background:${p[2]}"></span>${p[0]}</button>`).join("");
    wrap.querySelectorAll(".preset").forEach(b => b.onclick = () => {
      const p = presets[b.dataset.p];
      form.querySelector('[name=primary]').value = p[1];
      form.querySelector('[name=accent]').value = p[2];
      form.querySelector('[name=accent2]').value = p[3];
      updatePreview();
    });
  }

  /* ---- Init ---- */
  fillBrand();
  renderPresets();
  updatePreview();
  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);
  $("#generateBtn").addEventListener("click", generate);
  const db = $("#deployBtn"); if (db) db.addEventListener("click", deployToGitHub);
})();
