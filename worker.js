const CONTENT_KEY = "site-content";
const DEFAULT_CONTENT_PATH = "/content/default-content.json";

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function mergeContent(defaults, saved) {
  return {
    ...defaults,
    ...saved,
    site: { ...(defaults.site || {}), ...(saved.site || {}) },
    hero: { ...(defaults.hero || {}), ...(saved.hero || {}) },
    research: { ...(defaults.research || {}), ...(saved.research || {}) },
    updates: { ...(defaults.updates || {}), ...(saved.updates || {}) },
    contact: { ...(defaults.contact || {}), ...(saved.contact || {}) },
    theme: { ...(defaults.theme || {}), ...(saved.theme || {}) },
    news: saved.news || defaults.news || [],
    intro: saved.intro || defaults.intro || [],
    people: saved.people || defaults.people || [],
    peopleSection: { ...(defaults.peopleSection || {}), ...(saved.peopleSection || {}) },
    publicationSection: {
      ...(defaults.publicationSection || {}),
      ...(saved.publicationSection || {}),
    },
    publications: saved.publications || defaults.publications || "",
  };
}

async function loadDefaults(request, env) {
  const url = new URL(DEFAULT_CONTENT_PATH, request.url);
  const response = await env.ASSETS.fetch(new Request(url, request));

  if (!response.ok) {
    throw new Error("Default content could not be loaded.");
  }

  return response.json();
}

async function getContent(request, env) {
  const defaults = await loadDefaults(request, env);
  const saved = env.SITE_CONTENT ? await env.SITE_CONTENT.get(CONTENT_KEY, "json") : null;
  return jsonResponse(mergeContent(defaults, saved || {}));
}

async function saveContent(request, env) {
  const configuredCode = env.ADMIN_CODE || "sulab-2026";
  const submittedCode = request.headers.get("x-admin-code") || "";

  if (submittedCode !== configuredCode) {
    return jsonResponse({ error: "The editor code did not match." }, { status: 401 });
  }

  if (!env.SITE_CONTENT) {
    return jsonResponse(
      {
        error:
          "Cloudflare KV is not connected yet. Add a KV binding named SITE_CONTENT to this Worker, then save again.",
      },
      { status: 501 },
    );
  }

  const payload = await request.json();
  await env.SITE_CONTENT.put(CONTENT_KEY, JSON.stringify(payload));
  return jsonResponse({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/content") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204 });
      }

      if (request.method === "GET") {
        return getContent(request, env);
      }

      if (request.method === "POST") {
        return saveContent(request, env);
      }

      return jsonResponse({ error: "Method not allowed." }, { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
