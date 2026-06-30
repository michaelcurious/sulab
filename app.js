const publicationList = document.querySelector("#publication-list");
const featuredPublications = document.querySelector("#featured-publications");
const publicationSearch = document.querySelector("#publication-search");
const filterButtons = [...document.querySelectorAll(".filter-button")];
let publications = [];
let activeFilter = "all";
let siteContent = null;

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) {
    element.textContent = value;
  }
}

function setEmailLinks(email) {
  if (!email) return;

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.href = `mailto:${email}`;
    if (link.textContent.includes("@")) {
      link.textContent = email;
    }
  });
}

function renderNews(newsItems = []) {
  const track = document.querySelector(".ticker-track");
  if (!track || !newsItems.length) return;

  const items = newsItems
    .map(
      (item) => `
        <article>
          <time datetime="${item.date || ""}">${item.label || item.date || "News"}</time>
          <span>${item.text || ""}</span>
        </article>
      `,
    )
    .join("");

  const duplicateItems = newsItems
    .map(
      (item) => `
        <article aria-hidden="true">
          <time datetime="${item.date || ""}">${item.label || item.date || "News"}</time>
          <span>${item.text || ""}</span>
        </article>
      `,
    )
    .join("");

  track.innerHTML = items + duplicateItems;
}

function applySiteContent(content) {
  if (!content) return;

  setText("#hero-title", content.hero?.title);
  setText(".hero-copy", content.hero?.copy);
  setText("#research .section-copy h2", content.research?.title);
  setText("#research .section-copy p:last-child", content.research?.copy);
  setText("#join .join-panel h2", content.join?.title);
  setText("#join .join-panel p:not(.eyebrow)", content.join?.copy);
  setText("#join .news-panel h2", content.updates?.title);
  setText("#join .news-panel p:not(.eyebrow)", content.updates?.copy);
  setEmailLinks(content.contact?.email);
  renderNews(content.news);
}

function cleanText(value) {
  return value
    .replaceAll("\u00c3\u00a9", "e")
    .replaceAll("\u00c3\u00a7", "c")
    .replaceAll("\u00c2", "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePublication(entry, index) {
  const text = cleanText(entry);
  const pmidMatch = text.match(/PMID:\s?(\d+)|PubMed ID:\s?(\d+)/i);
  const doiMatch = text.match(/doi:\s?([^\s.]+(?:\.[^\s.]+)*\/[^\s;]+)/i);
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  const pmid = pmidMatch ? pmidMatch[1] || pmidMatch[2] : "";
  const doi = doiMatch ? doiMatch[1].replace(/[.;,]$/, "") : "";
  const year = yearMatch ? yearMatch[0] : "n.d.";
  const firstPeriod = text.indexOf(".");
  const titleStart = firstPeriod >= 0 ? firstPeriod + 1 : 0;
  const titleEndCandidates = [
    text.indexOf(" PMID"),
    text.indexOf(" PubMed ID"),
    text.indexOf(" doi:"),
  ].filter((value) => value > titleStart);
  const titleEnd = titleEndCandidates.length ? Math.min(...titleEndCandidates) : text.length;
  const title = cleanText(text.slice(titleStart, titleEnd)).replace(/[.;]$/, "");

  return {
    id: `${year}-${index}`,
    text,
    pmid,
    doi,
    year,
    title: title || text,
    decade: year === "n.d." ? "unknown" : `${year.slice(0, 3)}0`,
    href: pmid
      ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      : doi
        ? `https://doi.org/${doi}`
        : text.match(/https?:\/\/[^\s]+/)?.[0] || "",
  };
}

function publicationCard(pub, featured = false) {
  const link = pub.href
    ? `<a class="${featured ? "" : "publication-link"}" href="${pub.href}" target="_blank" rel="noreferrer">${pub.pmid ? `PMID ${pub.pmid}` : "Open paper"}</a>`
    : `<span class="publication-meta">Citation only</span>`;

  if (featured) {
    return `
      <article class="featured-pub">
        <p class="publication-year">${pub.year}</p>
        <h3>${pub.title}</h3>
        ${link}
      </article>
    `;
  }

  return `
    <article class="publication-item">
      <span class="publication-year">${pub.year}</span>
      <div>
        <p class="publication-title">${pub.title}</p>
        <p class="publication-citation">${pub.text}</p>
      </div>
      ${link}
    </article>
  `;
}

function renderPublications() {
  const query = publicationSearch.value.toLowerCase().trim();
  const filtered = publications.filter((pub) => {
    const decadeMatch = activeFilter === "all" || pub.decade === activeFilter;
    const queryMatch = !query || `${pub.title} ${pub.text} ${pub.pmid} ${pub.year}`.toLowerCase().includes(query);
    return decadeMatch && queryMatch;
  });

  publicationList.innerHTML = filtered.length
    ? filtered.map((pub) => publicationCard(pub)).join("")
    : `<p class="publication-meta">No publications match that filter.</p>`;
}

async function loadPublications() {
  let text = siteContent?.publications || "";

  if (!text.trim()) {
    const response = await fetch("content/publications.txt");
    text = await response.text();
  }

  publications = text
    .split(/\n\s*\n/)
    .map((entry, index) => parsePublication(entry, index))
    .filter((pub) => pub.text.length > 20);

  featuredPublications.innerHTML = publications.slice(0, 3).map((pub) => publicationCard(pub, true)).join("");
  renderPublications();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderPublications();
  });
});

publicationSearch.addEventListener("input", renderPublications);

async function loadSiteContent() {
  try {
    const response = await fetch("/api/content", { cache: "no-store" });
    if (response.ok) {
      siteContent = await response.json();
      applySiteContent(siteContent);
      return;
    }
  } catch (error) {
    const response = await fetch("content/default-content.json");
    siteContent = await response.json();
    applySiteContent(siteContent);
  }
}

loadSiteContent().then(loadPublications).catch(() => {
  publicationList.innerHTML = `<p class="publication-meta">Publication list could not load in this preview.</p>`;
});
