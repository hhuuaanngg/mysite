const form = document.querySelector("#work-form");
const listEl = document.querySelector("#work-list");
const titleEl = document.querySelector("#work-title");
const slugEl = document.querySelector("#work-slug");
const yearEl = document.querySelector("#work-year");
const featuredEl = document.querySelector("#work-featured");
const summaryEl = document.querySelector("#work-summary");
const problemEl = document.querySelector("#work-problem");
const solutionEl = document.querySelector("#work-solution");
const highlightsEl = document.querySelector("#work-highlights");
const stackEl = document.querySelector("#work-stack");
const repoEl = document.querySelector("#work-repo");
const urlEl = document.querySelector("#work-url");
const markEl = document.querySelector("#work-mark");
const fromEl = document.querySelector("#work-from");
const toEl = document.querySelector("#work-to");
const accentEl = document.querySelector("#work-accent");
const fromPicker = document.querySelector("#work-from-picker");
const toPicker = document.querySelector("#work-to-picker");
const accentPicker = document.querySelector("#work-accent-picker");
const statusEl = document.querySelector("#work-status");
const deleteBtn = document.querySelector("#work-delete-btn");
const previewLink = document.querySelector("#work-preview-link");
const coverPreview = document.querySelector("#work-cover-preview");
const coverMark = document.querySelector("#work-cover-mark");
const coverYear = document.querySelector("#work-cover-year");
const openSiteLink = document.querySelector("[data-open-site]");

function siteOrigin() {
  return (openSiteLink?.href || "http://127.0.0.1:3100").replace(/\/$/, "");
}

const DEFAULT_COVER = {
  mark: "",
  from: "#fde8d8",
  to: "#f7c9b4",
  accent: "#c4552a",
};

const state = {
  previousSlug: "",
  slugTouched: false,
  order: null,
};

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = `status ${kind}`.trim();
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function markFromTitle(value) {
  const slug = slugify(value);
  if (slug) return slug.slice(0, 2);
  return String(value).replace(/\s+/g, "").slice(0, 2);
}

function normalizeHex(value, fallback) {
  const hex = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : fallback;
}

async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}

function updateCoverPreview() {
  const from = normalizeHex(fromEl.value, DEFAULT_COVER.from);
  const to = normalizeHex(toEl.value, DEFAULT_COVER.to);
  const accent = normalizeHex(accentEl.value, DEFAULT_COVER.accent);
  coverPreview.style.background = `linear-gradient(155deg, ${from} 0%, ${to} 100%)`;
  coverMark.textContent = markEl.value.trim() || "aa";
  coverMark.style.color = accent;
  coverYear.textContent = yearEl.value.trim() || "年份";
  fromPicker.value = from;
  toPicker.value = to;
  accentPicker.value = accent;
}

function highlight(slug) {
  for (const button of listEl.querySelectorAll("button")) {
    button.classList.toggle("active", button.dataset.slug === slug);
  }
}

function resetForm() {
  state.previousSlug = "";
  state.slugTouched = false;
  state.order = null;
  titleEl.value = "";
  slugEl.value = "";
  yearEl.value = String(new Date().getFullYear());
  featuredEl.checked = false;
  summaryEl.value = "";
  problemEl.value = "";
  solutionEl.value = "";
  highlightsEl.value = "";
  stackEl.value = "";
  repoEl.value = "";
  urlEl.value = "";
  markEl.value = "";
  fromEl.value = DEFAULT_COVER.from;
  toEl.value = DEFAULT_COVER.to;
  accentEl.value = DEFAULT_COVER.accent;
  deleteBtn.hidden = true;
  previewLink.hidden = true;
  updateCoverPreview();
  setStatus("填好后点「保存到仓库」，会生成 src/content/works/<slug>.json。");
  highlight("");
}

async function refreshList(activeSlug = "") {
  const { works } = await api("/api/works");
  listEl.replaceChildren();
  for (const work of works) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.slug = work.slug;
    const title = document.createElement("strong");
    title.textContent = work.title;
    const meta = document.createElement("small");
    meta.textContent = `${work.featured ? "精选 · " : ""}${work.year}`;
    button.append(title, meta);
    button.addEventListener("click", () => loadWork(work.slug));
    item.append(button);
    listEl.append(item);
  }
  highlight(activeSlug);
}

async function loadWork(slug) {
  const { work } = await api(`/api/works/${slug}`);
  state.previousSlug = work.slug;
  state.slugTouched = true;
  state.order = work.order;
  titleEl.value = work.title;
  slugEl.value = work.slug;
  yearEl.value = work.year;
  featuredEl.checked = Boolean(work.featured);
  summaryEl.value = work.summary;
  problemEl.value = work.problem;
  solutionEl.value = work.solution;
  highlightsEl.value = (work.highlights || []).join("\n");
  stackEl.value = (work.stack || []).join("\n");
  repoEl.value = work.repo || "";
  urlEl.value = work.url || "";
  markEl.value = work.cover?.mark || "";
  fromEl.value = work.cover?.from || DEFAULT_COVER.from;
  toEl.value = work.cover?.to || DEFAULT_COVER.to;
  accentEl.value = work.cover?.accent || DEFAULT_COVER.accent;
  deleteBtn.hidden = false;
  previewLink.hidden = false;
  previewLink.href = `${siteOrigin()}/work/${work.slug}/`;
  updateCoverPreview();
  highlight(work.slug);
  setStatus(`正在编辑 ${work.slug}`);
}

function bindColor(picker, field) {
  picker.addEventListener("input", () => {
    field.value = picker.value;
    updateCoverPreview();
  });
  field.addEventListener("input", updateCoverPreview);
}

titleEl.addEventListener("input", () => {
  if (!state.slugTouched) {
    slugEl.value = slugify(titleEl.value);
    if (!markEl.dataset.touched) markEl.value = markFromTitle(titleEl.value);
  }
  updateCoverPreview();
});

slugEl.addEventListener("input", () => {
  state.slugTouched = true;
});

markEl.addEventListener("input", () => {
  markEl.dataset.touched = "1";
  updateCoverPreview();
});

yearEl.addEventListener("input", updateCoverPreview);
bindColor(fromPicker, fromEl);
bindColor(toPicker, toEl);
bindColor(accentPicker, accentEl);

document.querySelector("#new-work-btn").addEventListener("click", (event) => {
  event.preventDefault();
  delete markEl.dataset.touched;
  resetForm();
  titleEl.focus();
});

deleteBtn.addEventListener("click", async () => {
  if (!state.previousSlug) return;
  if (!confirm(`删除作品 ${state.previousSlug}？只会去掉对应的 JSON。`)) return;
  await api(`/api/works/${state.previousSlug}`, { method: "DELETE" });
  delete markEl.dataset.touched;
  resetForm();
  await refreshList();
  setStatus("已删除。", "ok");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("正在写入文件…");
  try {
    const payload = {
      title: titleEl.value.trim(),
      slug: slugEl.value.trim(),
      previousSlug: state.previousSlug,
      year: yearEl.value.trim(),
      featured: featuredEl.checked,
      order: state.order,
      summary: summaryEl.value.trim(),
      problem: problemEl.value,
      solution: solutionEl.value,
      highlights: highlightsEl.value,
      stack: stackEl.value,
      repo: repoEl.value.trim(),
      url: urlEl.value.trim(),
      cover: {
        mark: markEl.value.trim(),
        from: fromEl.value.trim(),
        to: toEl.value.trim(),
        accent: accentEl.value.trim(),
      },
    };
    const { work } = await api("/api/works", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.previousSlug = work.slug;
    state.order = work.order;
    deleteBtn.hidden = false;
    previewLink.hidden = false;
    previewLink.href = `${siteOrigin()}${work.preview}`;
    await refreshList(work.slug);
    setStatus(`已生成 ${work.files.join("、")}。打开预览确认后，提交 git 即可发布。`, "ok");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), "err");
  }
});

resetForm();
refreshList().catch((error) => setStatus(error.message, "err"));
