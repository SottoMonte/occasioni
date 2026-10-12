const portalPage = document.body.dataset.portalPage;
const portalData = { categories: [], articles: [], programs: [], selectedSector: "tutti" };

function renderIcons() {
  window.lucide?.createIcons();
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[character];
  });
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("it-IT");
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
  return portalData.categories
    .filter((category) => category.type === type)
    .sort((first, second) => Number(first.order || 0) - Number(second.order || 0));
}

function categoryName(id) {
  return portalData.categories.find((category) => category.id === id)?.name || id || "Senza categoria";
}

function readingTime(article) {
  const minutes = Number(article.reading_minutes);
  return Number.isInteger(minutes) && minutes > 0 ? `${minutes} min` : "Guida";
}

function initializeSharedShell() {
  const menuToggle = document.querySelector("#menu-toggle");
  const navigation = document.querySelector("#primary-navigation");
  const currentYear = document.querySelector("#current-year");

  if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      menuToggle.setAttribute("aria-label", expanded ? "Apri il menu" : "Chiudi il menu");
      navigation.classList.toggle("is-open", !expanded);
    });

    navigation.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Apri il menu");
      navigation.classList.remove("is-open");
    });
  }

  if (currentYear) currentYear.textContent = String(new Date().getFullYear());
  renderIcons();
}

async function fetchCollection(path, key) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Impossibile caricare ${path}: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data[key])) throw new Error(`Formato non valido in ${path}`);
  return data[key];
}

async function loadPortalData() {
  try {
    [portalData.categories, portalData.articles, portalData.programs] = await Promise.all([
      fetchCollection("data/categories.json", "categories"),
      fetchCollection("data/articles.json", "articles"),
      fetchCollection("data/programs.json", "programs"),
    ]);

    if (portalPage === "guides") initializeGuidesPage();
    if (portalPage === "opportunities") initializeOpportunitiesPage();
    if (portalPage === "community") renderCommunityTopics();
  } catch (error) {
    console.error("Errore durante il caricamento del portale.", error);
    const status = document.querySelector("[data-portal-status]");
    if (status) status.textContent = "Non è stato possibile caricare i contenuti. Riprova più tardi.";
  }
}

function renderGuideArticles() {
  const search = document.querySelector("#guide-search");
  const categoryFilter = document.querySelector("#guide-category-filter");
  const grid = document.querySelector("#guide-grid");
  const status = document.querySelector("#guide-status");
  const empty = document.querySelector("#guide-empty");
  const query = normalizeText(search.value.trim());
  const categoryId = categoryFilter.value;

  const visibleArticles = portalData.articles.filter((article) => {
    const tags = asList(article.tags).join(" ");
    const searchable = normalizeText(`${article.title} ${article.excerpt} ${categoryName(article.category_id)} ${tags}`);
    return article.published !== false
      && (categoryId === "tutte" || article.category_id === categoryId)
      && searchable.includes(query);
  });

  grid.innerHTML = visibleArticles.map((article, index) => {
    const image = safeContentUrl(article.image)
      || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=82";
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
          <button class="article-card__read" type="button" data-open-article="${escapeHTML(article.id)}">Anteprima articolo <i data-lucide="arrow-up-right" aria-hidden="true"></i></button>
        </div>
      </article>
    `;
  }).join("");
  renderIcons();

  status.textContent = `${visibleArticles.length} ${visibleArticles.length === 1 ? "articolo" : "articoli"}`;
  empty.hidden = visibleArticles.length > 0;
}

function openArticlePreview(id) {
  const article = portalData.articles.find((item) => item.id === id);
  const dialog = document.querySelector("#article-dialog");
  if (!article || !dialog) return;

  const lead = String(article.body ?? "").trim().split(/\n\s*\n/).find(Boolean) || article.excerpt;
  document.querySelector("#article-dialog-category").textContent = categoryName(article.category_id);
  document.querySelector("#article-dialog-title").textContent = article.title;
  document.querySelector("#article-dialog-meta").textContent = `${readingTime(article)} di lettura`;
  document.querySelector("#article-dialog-body").innerHTML = `<p>${escapeHTML(lead).replace(/\n/g, "<br />")}</p>`;
  document.querySelector("#article-dialog-link").href = `articolo.html?id=${encodeURIComponent(article.id)}`;
  dialog.showModal();
}

function initializeGuidesPage() {
  const search = document.querySelector("#guide-search");
  const categoryFilter = document.querySelector("#guide-category-filter");
  const grid = document.querySelector("#guide-grid");
  const guideCategories = categoriesByType("guide");

  categoryFilter.replaceChildren(new Option("Tutte le categorie", "tutte"));
  guideCategories.forEach((category) => categoryFilter.add(new Option(category.name, category.id)));
  const requestedCategory = new URLSearchParams(window.location.search).get("categoria");
  if (guideCategories.some((category) => category.id === requestedCategory)) {
    categoryFilter.value = requestedCategory;
  }

  search.addEventListener("input", renderGuideArticles);
  categoryFilter.addEventListener("change", renderGuideArticles);
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-article]");
    if (button) {
      openArticlePreview(button.dataset.openArticle);
      return;
    }
    const card = event.target.closest("[data-article-id]");
    if (card && !event.target.closest("a, button, input, select")) openArticlePreview(card.dataset.articleId);
  });

  renderGuideArticles();
}

function renderGuideCategories() {
  const grid = document.querySelector("#guide-categories");
  const guideCategories = categoriesByType("guide");

  grid.innerHTML = guideCategories.map((category, index) => `
    <a class="category-link" href="guide.html?categoria=${encodeURIComponent(category.id)}">
      <span class="category-link__number">${String(index + 1).padStart(2, "0")}</span>
      <span><strong>${escapeHTML(category.name)}</strong><small>${escapeHTML(category.description || "Esplora le guide di questo tema.")}</small></span>
      <span class="category-link__arrow" aria-hidden="true"><i data-lucide="arrow-up-right"></i></span>
    </a>
  `).join("");
  renderIcons();
}

function renderSectorFilters() {
  const filter = document.querySelector("#sector-filter");
  const sectors = categoriesByType("sector");
  const options = [{ id: "tutti", name: "Tutti i settori" }, ...sectors];

  filter.innerHTML = options.map((sector) => `
    <button type="button" data-sector="${escapeHTML(sector.id)}" aria-pressed="${sector.id === portalData.selectedSector}">${escapeHTML(sector.name)}</button>
  `).join("");
}

function renderOpportunityPrograms() {
  const search = document.querySelector("#program-search");
  const grid = document.querySelector("#program-grid");
  const status = document.querySelector("#program-status");
  const empty = document.querySelector("#program-empty");
  const query = normalizeText(search.value.trim());

  const visiblePrograms = portalData.programs.filter((program) => {
    const sectors = asList(program.categories);
    const tags = asList(program.tags);
    const sectorNames = sectors.map(categoryName).join(" ");
    const searchable = normalizeText(`${program.name} ${program.type} ${program.description} ${tags.join(" ")} ${sectorNames}`);
    return program.published !== false
      && (portalData.selectedSector === "tutti" || sectors.includes(portalData.selectedSector))
      && searchable.includes(query);
  });

  grid.innerHTML = visiblePrograms.map((program) => {
    const tags = asList(program.tags);
    const index = portalData.programs.indexOf(program);
    const action = program.id
      ? `<button class="program-card__link" type="button" data-open-program="${escapeHTML(program.id)}">Anteprima programma <i data-lucide="arrow-up-right" aria-hidden="true"></i></button>`
      : `<span class="program-card__link">Anteprima programma <i data-lucide="arrow-up-right" aria-hidden="true"></i></span>`;

    return `
      <article class="program-card" data-program-index="${index}">
        <div class="program-card__head"><span class="program-card__type">${escapeHTML(program.type || "Programma di affiliazione")}</span><span class="program-card__icon" aria-hidden="true"><i data-lucide="link-2"></i></span></div>
        <h3>${escapeHTML(program.name)}</h3>
        <p class="program-card__description">${escapeHTML(program.description)}</p>
        <div class="program-card__sectors">${tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
        ${action}
      </article>
    `;
  }).join("");
  renderIcons();

  status.textContent = `${visiblePrograms.length} ${visiblePrograms.length === 1 ? "programma" : "programmi"} disponibili`;
  empty.hidden = visiblePrograms.length > 0;
}

function openProgramPreview(programOrId) {
  const program = typeof programOrId === "string"
    ? portalData.programs.find((item) => item.id === programOrId)
    : programOrId;
  const dialog = document.querySelector("#program-dialog");
  if (!program || !dialog) return;

  const labels = [
    ...asList(program.categories).map(categoryName),
    ...asList(program.tags),
  ];
  document.querySelector("#program-dialog-type").textContent = program.type || "Programma di affiliazione";
  document.querySelector("#program-dialog-title").textContent = program.name;
  document.querySelector("#program-dialog-meta").textContent = labels.length ? labels.join(" · ") : "Programma di affiliazione";
  document.querySelector("#program-dialog-description").textContent = program.description || "Consulta la scheda per i dettagli del programma.";
  document.querySelector("#program-dialog-tags").innerHTML = labels.map((label) => `<span>${escapeHTML(label)}</span>`).join("");

  const detailLink = document.querySelector("#program-dialog-link");
  const hasDetailPage = typeof program.id === "string" && program.id.trim().length > 0;
  detailLink.hidden = !hasDetailPage;
  if (hasDetailPage) detailLink.href = `programma.html?id=${encodeURIComponent(program.id)}`;
  dialog.showModal();
}

function initializeOpportunitiesPage() {
  const sectors = categoriesByType("sector");
  const requestedSector = new URLSearchParams(window.location.search).get("settore");
  if (sectors.some((sector) => sector.id === requestedSector)) portalData.selectedSector = requestedSector;

  renderGuideCategories();
  renderSectorFilters();

  document.querySelector("#program-search").addEventListener("input", renderOpportunityPrograms);
  document.querySelector("#sector-filter").addEventListener("click", (event) => {
    const button = event.target.closest("[data-sector]");
    if (!button) return;
    portalData.selectedSector = button.dataset.sector;
    renderSectorFilters();
    renderOpportunityPrograms();
  });
  document.querySelector("#program-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-program]");
    if (button) {
      openProgramPreview(button.dataset.openProgram);
      return;
    }
    const card = event.target.closest("[data-program-index]");
    if (!card || event.target.closest("a, button, input, select")) return;
    openProgramPreview(portalData.programs[Number(card.dataset.programIndex)]);
  });

  renderOpportunityPrograms();
}

function renderCommunityTopics() {
  const topics = categoriesByType("guide");
  const grid = document.querySelector("#community-topics");
  grid.innerHTML = topics.map((category, index) => `
    <a class="category-link" href="guide.html?categoria=${encodeURIComponent(category.id)}">
      <span class="category-link__number">${String(index + 1).padStart(2, "0")}</span>
      <span><strong>${escapeHTML(category.name)}</strong><small>${escapeHTML(category.description || "Guide e risorse per iniziare la conversazione.")}</small></span>
      <span class="category-link__arrow" aria-hidden="true"><i data-lucide="arrow-up-right"></i></span>
    </a>
  `).join("");
  renderIcons();
  document.querySelector("#community-topic-status").textContent = `${topics.length} temi da esplorare`;
}

function initializeMarketPage() {
  const form = document.querySelector("#market-form");
  const dialog = document.querySelector("#market-form-dialog");
  const contactMethod = document.querySelector("#market-contact-method");
  const contactValue = document.querySelector("#market-contact-value");
  const imageInput = document.querySelector("#market-image");
  const preview = document.querySelector("#market-preview");
  const empty = document.querySelector("#market-empty");
  const status = document.querySelector("#market-status");
  const maxImageSize = 5 * 1024 * 1024;
  let previewImageUrl = "";

  function updateContactInput() {
    const method = contactMethod.value;
    contactValue.type = method === "email" ? "email" : method === "link" ? "url" : "tel";
    contactValue.placeholder = method === "email" ? "nome@esempio.it" : method === "link" ? "https://…" : "+39 …";
  }

  function filterPreview() {
    if (!preview.dataset.searchable) return;
    const query = normalizeText(document.querySelector("#market-search").value.trim());
    const category = document.querySelector("#market-category-filter").value;
    const matches = normalizeText(preview.dataset.searchable).includes(query)
      && (category === "tutte" || preview.dataset.category === category);
    preview.hidden = !matches;
    empty.hidden = matches;
    empty.textContent = matches
      ? ""
      : "L’anteprima non corrisponde ai filtri impostati.";
    status.textContent = matches ? "1 anteprima locale, non pubblicata" : "Nessuna anteprima corrisponde ai filtri";
  }

  document.querySelector("#open-market-form").addEventListener("click", () => dialog.showModal());
  contactMethod.addEventListener("change", updateContactInput);
  updateContactInput();

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      status.textContent = "Seleziona un file immagine valido.";
      imageInput.value = "";
      return;
    }
    if (file.size > maxImageSize) {
      status.textContent = "L’immagine supera il limite di 5 MB.";
      imageInput.value = "";
      return;
    }
    if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    previewImageUrl = URL.createObjectURL(file);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const categoryValue = String(data.get("category") || "altro");
    const categoryLabel = document.querySelector("#market-category option:checked").textContent;
    const condition = document.querySelector("#market-condition option:checked").textContent;
    const price = String(data.get("price") || "").trim();
    const area = String(data.get("area") || "").trim();
    const description = String(data.get("description") || "").trim();
    const method = contactMethod.value;
    const contact = String(data.get("contact") || "").trim();
    const methodLabel = { phone: "Telefono o WhatsApp", email: "Email", link: "Link di contatto" }[method];
    const priceLabel = price === "" ? "Prezzo da concordare" : new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(price));
    const imageMarkup = previewImageUrl
      ? `<img class="market-listing__image" src="${escapeHTML(previewImageUrl)}" alt="Foto di ${escapeHTML(title)}" />`
      : `<div class="market-listing__image market-listing__image--empty" aria-label="Nessuna foto selezionata">Foto non selezionata</div>`;

    preview.innerHTML = `
      ${imageMarkup}
      <div class="market-listing__content">
        <p class="market-listing__preview-label">ANTEPRIMA LOCALE · NON PUBBLICATA</p>
        <div class="market-listing__meta"><span>${escapeHTML(categoryLabel)}</span><span>${escapeHTML(condition)}</span></div>
        <h3>${escapeHTML(title)}</h3>
        <p class="market-listing__price">${escapeHTML(priceLabel)}</p>
        ${area ? `<p class="market-listing__area">${escapeHTML(area)}</p>` : ""}
        <p class="market-listing__description">${escapeHTML(description).replace(/\n/g, "<br />")}</p>
        <p class="market-listing__contact"><strong>${escapeHTML(methodLabel)}:</strong> ${escapeHTML(contact)}</p>
        <button class="market-listing__remove" id="clear-market-preview" type="button">Rimuovi anteprima <i data-lucide="x" aria-hidden="true"></i></button>
      </div>
    `;
    renderIcons();
    preview.dataset.category = categoryValue;
    preview.dataset.searchable = `${title} ${categoryLabel} ${description} ${area} ${methodLabel}`;
    preview.hidden = false;
    empty.hidden = true;
    status.textContent = "Anteprima creata solo in questa scheda. Non è stata inviata né salvata.";
    dialog.close();
    form.reset();
    updateContactInput();
    filterPreview();
    preview.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.querySelector("#market-preview").addEventListener("click", (event) => {
    if (!event.target.closest("#clear-market-preview")) return;
    if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    previewImageUrl = "";
    preview.hidden = true;
    preview.innerHTML = "";
    delete preview.dataset.category;
    delete preview.dataset.searchable;
    empty.hidden = false;
    empty.textContent = "Non ci sono ancora annunci pubblicati. La demo mostra soltanto le anteprime create in questa scheda.";
    status.textContent = "Anteprima rimossa.";
  });

  document.querySelector("#market-search").addEventListener("input", filterPreview);
  document.querySelector("#market-category-filter").addEventListener("change", filterPreview);
}

initializeSharedShell();
if (portalPage === "market") initializeMarketPage();
else if (["guides", "opportunities", "community"].includes(portalPage)) loadPortalData();