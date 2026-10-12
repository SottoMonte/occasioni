const fallbackImage =
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=82";

let categories = [];
let articles = [];
let programs = [];
let selectedSector = "tutti";

const elements = {
  articleDialog: document.querySelector("#article-dialog"),
  articleDialogBody: document.querySelector("#article-dialog-body"),
  articleDialogCategory: document.querySelector("#article-dialog-category"),
  articleDialogLink: document.querySelector("#article-dialog-link"),
  articleDialogMeta: document.querySelector("#article-dialog-meta"),
  articleDialogTitle: document.querySelector("#article-dialog-title"),
  categoryGrid: document.querySelector("#category-grid"),
  currentYear: document.querySelector("#current-year"),
  guideCategoryFilter: document.querySelector("#guide-category-filter"),
  guideEmpty: document.querySelector("#guide-empty"),
  guideGrid: document.querySelector("#guide-grid"),
  guideSearch: document.querySelector("#guide-search"),
  guideStatus: document.querySelector("#guide-status"),
  menuToggle: document.querySelector("#menu-toggle"),
  navigation: document.querySelector("#primary-navigation"),
  programGrid: document.querySelector("#program-grid"),
  programDialog: document.querySelector("#program-dialog"),
  programDialogDescription: document.querySelector("#program-dialog-description"),
  programDialogLink: document.querySelector("#program-dialog-link"),
  programDialogMeta: document.querySelector("#program-dialog-meta"),
  programDialogTags: document.querySelector("#program-dialog-tags"),
  programDialogTitle: document.querySelector("#program-dialog-title"),
  programDialogType: document.querySelector("#program-dialog-type"),
  programSearch: document.querySelector("#program-search"),
  programStatus: document.querySelector("#program-status"),
  sectorFilter: document.querySelector("#sector-filter"),
};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
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

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("it-IT");
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function safeContentUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim(), window.location.href);
    return url.protocol === "https:" || url.origin === window.location.origin ? url.href : "";
  } catch {
    return "";
  }
}

function categoriesByType(type) {
  return categories
    .filter((category) => category.type === type)
    .sort((first, second) => Number(first.order || 0) - Number(second.order || 0));
}

function categoryName(id) {
  return categories.find((category) => category.id === id)?.name || id || "Senza categoria";
}

function renderCategories() {
  const guideCategories = categoriesByType("guide");
  const selectedCategory = elements.guideCategoryFilter.value;

  elements.categoryGrid.innerHTML = guideCategories.map((category, index) => `
    <a class="category-link" href="#guide" data-category-link="${escapeHTML(category.id)}">
      <span class="category-link__number">${String(index + 1).padStart(2, "0")}</span>
      <span><strong>${escapeHTML(category.name)}</strong><small>${escapeHTML(category.description || "")}</small></span>
      <span class="category-link__arrow" aria-hidden="true">↗</span>
    </a>
  `).join("");

  elements.guideCategoryFilter.replaceChildren(new Option("Tutte le categorie", "tutte"));
  guideCategories.forEach((category) => {
    elements.guideCategoryFilter.add(new Option(category.name, category.id));
  });

  if (guideCategories.some((category) => category.id === selectedCategory)) {
    elements.guideCategoryFilter.value = selectedCategory;
  }
}

function readingTime(article) {
  const minutes = Number(article.reading_minutes);
  return Number.isInteger(minutes) && minutes > 0 ? `${minutes} min` : "Guida";
}

function renderGuides() {
  const query = normalizeText(elements.guideSearch.value.trim());
  const categoryId = elements.guideCategoryFilter.value;
  const visibleArticles = articles.filter((article) => {
    const tags = asList(article.tags).join(" ");
    const searchable = normalizeText(`${article.title} ${article.excerpt} ${categoryName(article.category_id)} ${tags}`);
    return article.published !== false
      && (categoryId === "tutte" || article.category_id === categoryId)
      && searchable.includes(query);
  });

  elements.guideGrid.innerHTML = visibleArticles.map((article, index) => {
    const image = safeContentUrl(article.image) || fallbackImage;
    return `
      <article class="article-card" data-article-id="${escapeHTML(article.id)}">
        <div class="article-card__image-wrap">
          <img class="article-card__image" src="${escapeHTML(image)}" alt="${escapeHTML(article.image_alt || "")}" loading="lazy" />
          <span class="article-card__number">${String(index + 1).padStart(2, "0")}</span>
        </div>
        <div class="article-card__content">
          <div class="article-card__meta"><span>${escapeHTML(categoryName(article.category_id))}</span><span>${escapeHTML(readingTime(article))} di lettura</span></div>
          <h3>${escapeHTML(article.title)}</h3>
          <p class="article-card__excerpt">${escapeHTML(article.excerpt)}</p>
          <button class="article-card__read" type="button" data-open-article="${escapeHTML(article.id)}">Anteprima articolo <span aria-hidden="true">↗</span></button>
        </div>
      </article>
    `;
  }).join("");

  elements.guideStatus.textContent = `${visibleArticles.length} ${visibleArticles.length === 1 ? "articolo" : "articoli"}`;
  elements.guideEmpty.hidden = visibleArticles.length > 0;
}

function renderSectorFilters() {
  const sectorCategories = categoriesByType("sector");
  const availableSectors = new Set(sectorCategories.map((category) => category.id));
  if (selectedSector !== "tutti" && !availableSectors.has(selectedSector)) selectedSector = "tutti";

  const filters = [{ id: "tutti", name: "Tutti i settori" }, ...sectorCategories];
  elements.sectorFilter.innerHTML = filters.map((sector) => `
    <button type="button" data-sector="${escapeHTML(sector.id)}" aria-pressed="${sector.id === selectedSector}">${escapeHTML(sector.name)}</button>
  `).join("");
}

function renderPrograms() {
  const query = normalizeText(elements.programSearch.value.trim());
  const visiblePrograms = programs.filter((program) => {
    const programCategories = asList(program.categories);
    const tags = asList(program.tags);
    const categoryLabels = programCategories.map(categoryName).join(" ");
    const searchable = normalizeText(`${program.name} ${program.type} ${program.description} ${tags.join(" ")} ${categoryLabels}`);
    return program.published !== false
      && (selectedSector === "tutti" || programCategories.includes(selectedSector))
      && searchable.includes(query);
  });

  elements.programGrid.innerHTML = visiblePrograms.map((program) => {
    const tags = asList(program.tags);
    const programIndex = programs.indexOf(program);
    const programLink = program.id
      ? `<button class="program-card__link" type="button" data-open-program="${escapeHTML(program.id)}">Anteprima programma <span aria-hidden="true">↗</span></button>`
      : `<span class="program-card__link">Anteprima programma <span aria-hidden="true">↗</span></span>`;

    return `
      <article class="program-card" data-program-index="${programIndex}">
        <span class="program-card__type">${escapeHTML(program.type)}</span>
        <h3>${escapeHTML(program.name)}</h3>
        <p class="program-card__description">${escapeHTML(program.description)}</p>
        <div class="program-card__sectors">${tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
        ${programLink}
      </article>
    `;
  }).join("");

  elements.programStatus.textContent = `${visiblePrograms.length} ${visiblePrograms.length === 1 ? "programma" : "programmi"} in elenco`;
}

function openArticle(id) {
  const article = articles.find((item) => item.id === id);
  if (!article) return;

  const lead = String(article.body ?? "")
    .trim()
    .split(/\n\s*\n/)
    .find(Boolean) || article.excerpt;

  elements.articleDialogCategory.textContent = categoryName(article.category_id);
  elements.articleDialogTitle.textContent = article.title;
  elements.articleDialogMeta.textContent = `${readingTime(article)} di lettura`;
  elements.articleDialogBody.innerHTML = `<p>${escapeHTML(lead).replace(/\n/g, "<br />")}</p>`;
  elements.articleDialogLink.href = `articolo.html?id=${encodeURIComponent(article.id)}`;

  elements.articleDialog.showModal();
}

function openProgram(programOrId) {
  const program = typeof programOrId === "string"
    ? programs.find((item) => item.id === programOrId)
    : programOrId;
  if (!program) return;

  const labels = [
    ...asList(program.categories).map(categoryName),
    ...asList(program.tags),
  ];

  elements.programDialogType.textContent = program.type || "Programma di affiliazione";
  elements.programDialogTitle.textContent = program.name;
  elements.programDialogMeta.textContent = labels.length ? labels.join(" · ") : "Programma di affiliazione";
  elements.programDialogDescription.textContent = program.description || "Consulta la scheda per i dettagli del programma.";
  elements.programDialogTags.innerHTML = labels.map((label) => `<span>${escapeHTML(label)}</span>`).join("");
  const hasDetailPage = typeof program.id === "string" && program.id.trim().length > 0;
  elements.programDialogLink.hidden = !hasDetailPage;
  if (hasDetailPage) {
    elements.programDialogLink.href = `programma.html?id=${encodeURIComponent(program.id)}`;
  }
  elements.programDialog.showModal();
}

async function fetchCollection(path, key) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Impossibile caricare ${path}: ${response.status}`);

  const data = await response.json();
  if (!Array.isArray(data[key])) throw new Error(`Formato non valido in ${path}`);
  return data[key];
}

async function loadContent() {
  try {
    [categories, articles, programs] = await Promise.all([
      fetchCollection("data/categories.json", "categories"),
      fetchCollection("data/articles.json", "articles"),
      fetchCollection("data/programs.json", "programs"),
    ]);

    renderCategories();
    renderGuides();
    renderSectorFilters();
    renderPrograms();
  } catch (error) {
    elements.categoryGrid.innerHTML = '<p class="empty-state">Categorie non disponibili.</p>';
    elements.guideStatus.textContent = "Impossibile caricare gli articoli. Riprova più tardi.";
    elements.programStatus.textContent = "Impossibile caricare la directory. Riprova più tardi.";
    console.error("Errore durante il caricamento dei contenuti editoriali.", error);
  }
}

elements.guideSearch.addEventListener("input", renderGuides);
elements.guideCategoryFilter.addEventListener("change", renderGuides);
elements.programSearch.addEventListener("input", renderPrograms);

elements.sectorFilter.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sector]");
  if (!button) return;
  selectedSector = button.dataset.sector;
  renderSectorFilters();
  renderPrograms();
});

elements.categoryGrid.addEventListener("click", (event) => {
  const link = event.target.closest("[data-category-link]");
  if (!link) return;
  elements.guideCategoryFilter.value = link.dataset.categoryLink;
  elements.guideSearch.value = "";
  renderGuides();
});

elements.guideGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-article]");
  if (button) {
    openArticle(button.dataset.openArticle);
    return;
  }

  const card = event.target.closest("[data-article-id]");
  if (card && !event.target.closest("a, button, input, select, textarea")) {
    openArticle(card.dataset.articleId);
  }
});

elements.programGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-program]");
  if (button) {
    openProgram(button.dataset.openProgram);
    return;
  }

  const card = event.target.closest("[data-program-index]");
  if (!card || event.target.closest("a, button, input, select, textarea")) return;
  openProgram(programs[Number(card.dataset.programIndex)]);
});

elements.menuToggle.addEventListener("click", () => {
  const expanded = elements.menuToggle.getAttribute("aria-expanded") === "true";
  elements.menuToggle.setAttribute("aria-expanded", String(!expanded));
  elements.menuToggle.setAttribute("aria-label", expanded ? "Apri il menu" : "Chiudi il menu");
  elements.navigation.classList.toggle("is-open", !expanded);
});

elements.navigation.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  elements.menuToggle.setAttribute("aria-expanded", "false");
  elements.menuToggle.setAttribute("aria-label", "Apri il menu");
  elements.navigation.classList.remove("is-open");
});

elements.currentYear.textContent = String(new Date().getFullYear());
loadContent();