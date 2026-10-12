const pageType = document.body.dataset.contentPage;
window.lucide?.createIcons();

const elements = {
  article: document.querySelector("#article-detail"),
  breadcrumb: document.querySelector("#detail-breadcrumb"),
  categories: document.querySelector("#detail-categories"),
  category: document.querySelector("#detail-category"),
  description: document.querySelector("#detail-description"),
  errorMessage: document.querySelector("#detail-error-message"),
  excerpt: document.querySelector("#detail-excerpt"),
  image: document.querySelector("#detail-image"),
  metaDescription: document.querySelector("#page-description"),
  notFound: document.querySelector("#detail-not-found"),
  officialLink: document.querySelector("#official-link"),
  points: document.querySelector("#detail-points"),
  pointsSection: document.querySelector("#detail-points-section"),
  program: document.querySelector("#program-detail"),
  readingTime: document.querySelector("#detail-reading-time"),
  state: document.querySelector("#detail-state"),
  tags: document.querySelector("#detail-tags"),
  title: document.querySelector("#detail-title"),
  type: document.querySelector("#detail-type"),
  body: document.querySelector("#detail-body"),
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

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function safeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim(), window.location.href);
    return url.protocol === "https:" || url.origin === window.location.origin ? url.href : "";
  } catch {
    return "";
  }
}

function categoryName(categories, id) {
  return categories.find((category) => category.id === id)?.name || id || "Senza categoria";
}

function showNotFound(message) {
  elements.state.hidden = true;
  elements.notFound.hidden = false;
  elements.errorMessage.textContent = message;
}

function renderArticle(article, categories) {
  const minutes = Number(article.reading_minutes);
  const paragraphs = String(article.body ?? "")
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);
  const points = asList(article.key_points);
  const tags = asList(article.tags);
  const imageUrl = safeImageUrl(article.image);

  elements.category.textContent = categoryName(categories, article.category_id);
  elements.title.textContent = article.title;
  elements.breadcrumb.textContent = article.title;
  elements.excerpt.textContent = article.excerpt || "";
  elements.readingTime.textContent = Number.isInteger(minutes) && minutes > 0 ? `${minutes} min di lettura` : "Guida pratica";
  elements.tags.innerHTML = tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
  elements.image.hidden = !imageUrl;
  if (imageUrl) {
    elements.image.src = imageUrl;
    elements.image.alt = article.image_alt || article.title;
  }

  elements.body.innerHTML = paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph).replace(/\n/g, "<br />")}</p>`).join("");
  elements.pointsSection.hidden = points.length === 0;
  elements.points.innerHTML = points.map((point) => `<li>${escapeHTML(point)}</li>`).join("");
  elements.metaDescription.setAttribute("content", article.excerpt || article.title);
  document.title = `${article.title} — Occasioni.online`;
  elements.state.hidden = true;
  elements.article.hidden = false;
}

function renderProgram(program, categories) {
  const categoryIds = asList(program.categories);
  const tags = asList(program.tags);
  const url = typeof program.url === "string" && /^https:\/\//i.test(program.url.trim())
    ? program.url.trim()
    : "";

  elements.type.textContent = program.type || "Programma di affiliazione";
  elements.title.textContent = program.name;
  elements.breadcrumb.textContent = program.name;
  elements.description.textContent = program.description || "";
  elements.categories.innerHTML = categoryIds.map((id) => `<span>${escapeHTML(categoryName(categories, id))}</span>`).join("");
  elements.tags.innerHTML = tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
  elements.officialLink.hidden = !url;
  if (url) elements.officialLink.href = url;
  elements.metaDescription.setAttribute("content", program.description || program.name);
  document.title = `${program.name} — Occasioni.online`;
  elements.state.hidden = true;
  elements.program.hidden = false;
}

async function loadDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    showNotFound("Manca l’identificativo del contenuto richiesto.");
    return;
  }

  try {
    const [categoryResponse, contentResponse] = await Promise.all([
      fetch("data/categories.json", { cache: "no-cache" }),
      fetch(pageType === "article" ? "data/articles.json" : "data/programs.json", { cache: "no-cache" }),
    ]);
    if (!categoryResponse.ok || !contentResponse.ok) throw new Error("Impossibile caricare i dati.");

    const categoryData = await categoryResponse.json();
    const contentData = await contentResponse.json();
    const categories = asList(categoryData.categories);
    const collection = pageType === "article" ? asList(contentData.articles) : asList(contentData.programs);
    const content = collection.find((item) => item.id === id && item.published !== false);

    if (!content) {
      showNotFound("Il link potrebbe non essere corretto o il contenuto non è pubblicato.");
      return;
    }

    if (pageType === "article") renderArticle(content, categories);
    else renderProgram(content, categories);
  } catch (error) {
    console.error("Errore durante il caricamento della scheda.", error);
    showNotFound("Non è stato possibile caricare questa scheda. Riprova più tardi.");
  }
}

const menuToggle = document.querySelector("#menu-toggle");
const navigation = document.querySelector("#primary-navigation");

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

document.querySelector("#current-year").textContent = String(new Date().getFullYear());
loadDetail();