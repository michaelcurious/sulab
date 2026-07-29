const publicationList = document.querySelector("#publication-list");
const featuredPublications = document.querySelector("#featured-publications");
const publicationSearch = document.querySelector("#publication-search");
const filterButtons = [...document.querySelectorAll(".filter-button")];
let publications = [];
let activeFilter = "all";
let siteContent = null;

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value !== undefined && value !== null) {
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

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function personInitials(person) {
  if (person.initials) return person.initials.slice(0, 3).toUpperCase();
  return (person.name || "Su Lab")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function renderPeople(people = []) {
  const grid = document.querySelector("#people-grid");
  if (!grid || !people.length) return;

  grid.innerHTML = people
    .map((person, index) => {
      const portrait = person.image
        ? `<img class="portrait portrait-image" src="${escapeHtml(person.image)}" alt="${escapeHtml(person.name || "Lab member")}" />`
        : `<div class="portrait initials">${escapeHtml(personInitials(person))}</div>`;

      return `
        <article class="person-card ${index === 0 ? "featured" : ""}">
          ${portrait}
          <div>
            <h3>${escapeHtml(person.name || "Lab member")}</h3>
            <p class="role">${escapeHtml(person.title || "")}</p>
            <p>${escapeHtml(person.description || "")}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderIntro(items = []) {
  const band = document.querySelector("#intro-band");
  if (!band || !items.length) return;

  band.innerHTML = items
    .map(
      (item) => `
        <div>
          <span class="metric">${escapeHtml(item.metric || "")}</span>
          <p>${escapeHtml(item.text || "")}</p>
        </div>
      `,
    )
    .join("");
}

function renderResearchAreas(areas = []) {
  const grid = document.querySelector("#research-grid");
  if (!grid || !areas.length) return;

  grid.innerHTML = areas
    .map(
      (area) => `
        <article>
          <span class="tile-kicker">${escapeHtml(area.number || "")}</span>
          <h3>${escapeHtml(area.title || "")}</h3>
          <p>${escapeHtml(area.copy || "")}</p>
        </article>
      `,
    )
    .join("");
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
  setText("#brand-mark", content.site?.mark);
  setText("#brand-name", content.site?.name);
  setText("#brand-tagline", content.site?.tagline);
  setText("#news-label", content.site?.newsLabel);
  setText("#hero-eyebrow", content.site?.affiliation);
  setText("#hero-primary-button", content.hero?.primaryButton);
  setText("#hero-secondary-button", content.hero?.secondaryButton);
  setText(".hero-copy", content.hero?.copy);
  setText("#research-eyebrow", content.research?.eyebrow);
  setText("#research .section-copy h2", content.research?.title);
  setText("#research .section-copy p:last-child", content.research?.copy);
  setText("#people-eyebrow", content.peopleSection?.eyebrow);
  setText("#people-title", content.peopleSection?.title);
  setText("#publications-eyebrow", content.publicationSection?.eyebrow);
  setText("#publications-title", content.publicationSection?.title);
  setText("#publication-search-label", content.publicationSection?.searchLabel);
  if (content.publicationSection?.searchPlaceholder && publicationSearch) {
    publicationSearch.placeholder = content.publicationSection.searchPlaceholder;
  }
  setText("#updates .news-panel h2", content.updates?.title);
  setText("#updates .news-panel p:not(.eyebrow)", content.updates?.copy);
  setText("#contact-eyebrow", content.contact?.eyebrow);
  setText("#contact-title", content.contact?.title);
  setText("#contact-department", content.contact?.department);
  setText("#contact-institution", content.contact?.institution);
  setText("#cu-page-link", content.contact?.cuPageLabel);
  setText("#pubmed-link", content.contact?.pubmedLabel);
  setEmailLinks(content.contact?.email);
  renderIntro(content.intro);
  renderResearchAreas(content.research?.areas);
  renderNews(content.news);
  renderPeople(content.people);
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
  const params = new URLSearchParams(window.location.search);
  const previewContent = localStorage.getItem("su-lab-preview-content");

  if (params.get("preview") === "1" && previewContent) {
    siteContent = JSON.parse(previewContent);
    applySiteContent(siteContent);
    return;
  }

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
