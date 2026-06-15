/* ============================================================================
 * HMG StoreForge — Brand Configuration (Lead Generation Core)
 * ----------------------------------------------------------------------------
 * This file embeds the HMG / Adewale Samson Adeagbo brand into every generated
 * store and across the generator UI. EVERY store built with StoreForge carries
 * a "Powered by HMG Technologies" credit that links back to your sites and
 * WhatsApp — turning every client store into a permanent lead-generation asset.
 *
 * Edit ONE place here and it propagates everywhere.
 * ==========================================================================*/

const HMG_BRAND = {
  // --- Product identity ---
  product: "HMG StoreForge",
  tagline: "Launch a real online store in minutes — built for Nigerian businesses.",
  version: "9.0.0",

  // --- Creator / Company ---
  company: "HMG Technologies",
  parent: "HMG Concepts",
  founder: "Adewale Samson Adeagbo",
  founderTitle: "AI-Augmented Solutions Developer · Data Scientist · STEM Educator",
  location: "Lagos, Nigeria",
  motto: "His Marvellous Grace — Real problems. Real solutions.",
  established: 2015,

  // --- Contact (used for lead-gen CTAs everywhere) ---
  whatsapp: "2348100866322",          // international format, no +
  whatsappDisplay: "+234 810 086 6322",
  email: "hmgconcepts@gmail.com",      // ← UPDATE to your preferred lead-gen inbox

  // --- Links (the lead-gen network) ---
  links: {
    portfolio:    "https://cssadewale.pages.dev",
    concepts:     "https://hmgconcepts.pages.dev",
    academy:      "https://hmgacademy.pages.dev",
    technologies: "https://hmgtechnologies.pages.dev",
    media:        "https://hmgmedia.pages.dev",
    gospel:       "https://hmggospel.pages.dev",
    github:       "https://github.com/hmgtechnologies",
    youtube:      "https://youtube.com/@hmgconcepts",
    linkedin:     "https://linkedin.com/in/adewalesamsonadeagbo",
    instagram:    "https://instagram.com/cssadewale",
    x:            "https://x.com/cssadewale"
  },

  // --- Brand colours (derived from the HMG sites: deep navy + gold + teal) ---
  theme: {
    primary:   "#0f2a4a",  // HMG deep navy
    accent:    "#c9a227",  // HMG gold
    accent2:   "#14857c",  // teal
    dark:      "#0a1929",
    light:     "#f7f9fc",
    text:      "#1b2733"
  }
};

/** Build a pre-filled WhatsApp link for lead generation. */
function hmgWhatsAppLink(message) {
  const text = encodeURIComponent(
    message || `Hello HMG Technologies! I'm interested in HMG StoreForge / a custom online store.`
  );
  return `https://wa.me/${HMG_BRAND.whatsapp}?text=${text}`;
}

/** Standard "Powered by" footer HTML injected into every generated store. */
function hmgPoweredByHTML() {
  return `
  <div class="hmg-powered">
    <span>⚡ Powered by</span>
    <a href="${HMG_BRAND.links.technologies}" target="_blank" rel="noopener">${HMG_BRAND.company}</a>
    <span class="hmg-sep">·</span>
    <a href="${hmgWhatsAppLink('Hi! I saw your StoreForge work and want my own online store.')}" target="_blank" rel="noopener">Get your own store 💬</a>
  </div>`;
}

// Make available to both browser and Node (CLI) contexts.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { HMG_BRAND, hmgWhatsAppLink, hmgPoweredByHTML };
}
