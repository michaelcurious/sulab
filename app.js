const publicationList = document.querySelector("#publication-list");
const featuredPublications = document.querySelector("#featured-publications");
const publicationSearch = document.querySelector("#publication-search");
const filterButtons = [...document.querySelectorAll(".filter-button")];
let publications = [];
let activeFilter = "all";

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
  const response = await fetch("content/publications.txt");
  const text = await response.text();
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

loadPublications().catch(() => {
  publicationList.innerHTML = `<p class="publication-meta">Publication list could not load in this preview.</p>`;
});
