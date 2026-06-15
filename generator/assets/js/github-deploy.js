/* ============================================================================
 * HMG StoreForge v3 — Direct GitHub Deployment (github-deploy.js)
 * ----------------------------------------------------------------------------
 * Pushes a generated store straight to a new GitHub repository using the free
 * GitHub REST API and a Personal Access Token (PAT) you paste in. No backend,
 * no server, no cost. After pushing, it enables GitHub Pages automatically and
 * gives you the live URL.
 *
 * SECURITY: the token is used only in your browser to call api.github.com and is
 * never stored or sent anywhere else. Use a fine-scoped token (repo scope).
 *
 * Files map: { "path/in/repo": { content, encoding } }
 *   - text files: encoding "utf-8"
 *   - binary files: encoding "base64"
 * ==========================================================================*/

const GitHubDeploy = (function () {
  const API = "https://api.github.com";

  async function gh(token, method, path, body) {
    const res = await fetch(API + path, {
      method,
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      let msg = res.status + " " + res.statusText;
      try { const j = await res.json(); if (j.message) msg = j.message; } catch {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  // UTF-8 safe base64 for text content
  function toBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  /**
   * Deploy files to a new (or existing) repo.
   * @param {Object} opts {token, repo, description, isPrivate, files, binaries, onLog}
   *   files: { path: textContent }
   *   binaries: { path: base64Content }
   */
  async function deploy({ token, repo, description, isPrivate = false, files, binaries = {}, onLog = () => {} }) {
    if (!token) throw new Error("GitHub token is required.");
    if (!repo) throw new Error("Repository name is required.");

    // 1) Who am I?
    onLog("🔑 Verifying token…");
    const me = await gh(token, "GET", "/user");
    const owner = me.login;
    onLog(`✅ Authenticated as @${owner}`);

    // 2) Create the repo (or reuse if it exists)
    onLog(`📦 Creating repository "${repo}"…`);
    try {
      await gh(token, "POST", "/user/repos", {
        name: repo, description: description || "Online store built with HMG StoreForge",
        private: !!isPrivate, auto_init: true
      });
      onLog("✅ Repository created.");
      await sleep(1500); // let auto_init settle
    } catch (e) {
      if (/name already exists/i.test(e.message)) onLog("ℹ️ Repository already exists — updating it.");
      else throw e;
    }

    // 3) Get default branch
    const repoInfo = await gh(token, "GET", `/repos/${owner}/${repo}`);
    const branch = repoInfo.default_branch || "main";

    // 4) Upload every file via the Contents API (create or update)
    const allFiles = [];
    for (const [path, content] of Object.entries(files)) allFiles.push([path, toBase64(content)]);
    for (const [path, b64] of Object.entries(binaries)) allFiles.push([path, b64]);

    let i = 0;
    for (const [path, b64] of allFiles) {
      i++;
      onLog(`⬆️ (${i}/${allFiles.length}) ${path}`);
      // check if file exists to get its sha (needed for update)
      let sha;
      try {
        const existing = await gh(token, "GET", `/repos/${owner}/${repo}/contents/${encodeURI(path)}?ref=${branch}`);
        if (existing && existing.sha) sha = existing.sha;
      } catch { /* file doesn't exist yet */ }
      await gh(token, "PUT", `/repos/${owner}/${repo}/contents/${encodeURI(path)}`, {
        message: `Add ${path} via HMG StoreForge`,
        content: b64, branch, sha
      });
    }
    onLog("✅ All files uploaded.");

    // 5) Enable GitHub Pages on the default branch root
    onLog("🌐 Enabling GitHub Pages…");
    try {
      await gh(token, "POST", `/repos/${owner}/${repo}/pages`, {
        source: { branch, path: "/" }
      });
      onLog("✅ GitHub Pages enabled.");
    } catch (e) {
      // 409 = already enabled
      if (/409|already/i.test(e.message)) onLog("ℹ️ Pages already enabled.");
      else onLog("⚠️ Could not auto-enable Pages: " + e.message + " (enable manually in repo Settings → Pages).");
    }

    const pagesUrl = `https://${owner}.github.io/${repo}/`;
    const repoUrl = `https://github.com/${owner}/${repo}`;
    onLog(`🎉 Done! Live (in 1–2 min): ${pagesUrl}`);
    return { owner, repo, branch, pagesUrl, repoUrl };
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  return { deploy };
})();

if (typeof module !== "undefined" && module.exports) module.exports = { GitHubDeploy };
