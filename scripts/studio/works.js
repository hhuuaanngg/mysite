import { marked } from "/vendor/marked.esm.js";
import {
  applyHeading,
  insertSnippet,
  toggleLinePrefix,
  wrapSelection,
} from "./format.mjs";
import {
  COVER_PALETTES,
  DEFAULT_PALETTE_ID,
  resolveCoverPalette,
} from "./cover-palettes.mjs";

const form = document.querySelector("#work-form");
const listEl = document.querySelector("#work-list");
const titleEl = document.querySelector("#work-title");
const slugEl = document.querySelector("#work-slug");
const yearEl = document.querySelector("#work-year");
const featuredEl = document.querySelector("#work-featured");
const summaryEl = document.querySelector("#work-summary");
const bodyEl = document.querySelector("#work-body");
const previewEl = document.querySelector("#work-preview");
const stackEl = document.querySelector("#work-stack");
const repoEl = document.querySelector("#work-repo");
const urlEl = document.querySelector("#work-url");
const markEl = document.querySelector("#work-mark");
const palettesEl = document.querySelector("#work-palettes");
const statusEl = document.querySelector("#work-status");
const deleteBtn = document.querySelector("#work-delete-btn");
const previewLink = document.querySelector("#work-preview-link");
const coverPreview = document.querySelector("#work-cover-preview");
const coverMark = document.querySelector("#work-cover-mark");
const coverYear = document.querySelector("#work-cover-year");
const coverImageEl = document.querySelector("#work-cover-image");
const coverPreviewImage = document.querySelector("#work-cover-preview-image");
const coverCopy = document.querySelector("#work-cover-copy");
const coverClear = document.querySelector("#work-cover-clear");
const openSiteLink = document.querySelector("[data-open-site]");
const inlineImageInput = document.querySelector("#work-inline-image-input");
const toolbar = document.querySelector("#work-toolbar");

function siteOrigin() {
  return (openSiteLink?.href || "http://127.0.0.1:5680").replace(/\/$/, "");
}

const DEFAULT_COVER = COVER_PALETTES.find((item) => item.id === DEFAULT_PALETTE_ID);

const DEFAULT_BODY = `## 问题

当时碰到什么麻烦。

## 方案

后来怎么做成的。

## 技术要点

- 
`;

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "H1",
  "H2",
  "H3",
  "H4",
  "BLOCKQUOTE",
  "UL",
  "OL",
  "LI",
  "A",
  "IMG",
  "STRONG",
  "EM",
  "CODE",
  "PRE",
  "HR",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD",
  "DEL",
  "FIGURE",
  "FIGCAPTION",
]);

const state = {
  previousSlug: "",
  slugTouched: false,
  order: null,
  paletteId: DEFAULT_PALETTE_ID,
  coverBlob: null,
  coverKeep: false,
  coverSrc: "",
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

function mediaUrl(src) {
  if (!src) return "";
  if (src.startsWith("/__blob__/")) {
    const id = src.slice("/__blob__/".length).replace(/\.[a-z0-9]+$/i, "");
    return `/api/blobs/${id}`;
  }
  if (src.startsWith("/works/") || src.startsWith("/articles/")) return `/media${src}`;
  return src;
}

function sanitizePreview(root) {
  for (const el of [...root.querySelectorAll("*")]) {
    if (!ALLOWED_TAGS.has(el.tagName)) {
      el.replaceWith(...el.childNodes);
      continue;
    }
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || name === "srcdoc") el.removeAttribute(attr.name);
      if (el.tagName === "A" && name === "href" && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute("href");
      }
      if (el.tagName === "IMG" && name !== "src" && name !== "alt" && name !== "title") {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === "IMG") {
      el.src = mediaUrl(el.getAttribute("src") || "");
      el.loading = "lazy";
    }
    if (el.tagName === "A") {
      el.target = "_blank";
      el.rel = "noreferrer";
    }
  }
}

function updateMarkdownPreview() {
  const markdown = bodyEl.value.trim();
  if (!markdown) {
    previewEl.replaceChildren();
    return;
  }
  previewEl.innerHTML = marked.parse(markdown, { gfm: true, breaks: false });
  sanitizePreview(previewEl);
}

async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}

async function uploadFile(file) {
  const id = crypto.randomUUID().replaceAll("-", "");
  return api(`/api/blobs/${id}?name=${encodeURIComponent(file.name)}`, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
}

function applyEdit(result) {
  bodyEl.value = result.value;
  bodyEl.focus();
  bodyEl.setSelectionRange(result.start, result.end);
  updateMarkdownPreview();
}

function currentRange() {
  return {
    start: bodyEl.selectionStart,
    end: bodyEl.selectionEnd,
    value: bodyEl.value,
  };
}

function runFormat(kind) {
  const { value, start, end } = currentRange();
  if (kind === "bold") applyEdit(wrapSelection(value, start, end, "**"));
  if (kind === "italic") applyEdit(wrapSelection(value, start, end, "*"));
  if (kind === "h2") applyEdit(applyHeading(value, start, end, 2));
  if (kind === "h3") applyEdit(applyHeading(value, start, end, 3));
  if (kind === "quote") applyEdit(toggleLinePrefix(value, start, end, "> "));
  if (kind === "list") applyEdit(toggleLinePrefix(value, start, end, "- "));
  if (kind === "image") inlineImageInput.click();
}

async function insertImagesAtCursor(files) {
  if (!files?.length) return;
  let { value, start, end } = currentRange();
  for (const [index, file] of [...files].entries()) {
    const uploaded = await uploadFile(file);
    const alt = file.name.replace(/\.[^.]+$/, "");
    const result = insertSnippet(value, start, end, `![${alt}](${uploaded.src})`);
    value = result.value;
    start = result.start;
    end = result.end;
    if (index === 0 && !state.coverSrc) {
      state.coverBlob = uploaded.id;
      state.coverKeep = false;
      state.coverSrc = uploaded.src;
      updateCoverPreview();
    }
  }
  applyEdit({ value, start, end });
}

function currentPalette() {
  return (
    COVER_PALETTES.find((item) => item.id === state.paletteId) || DEFAULT_COVER
  );
}

function renderPalettes() {
  palettesEl.replaceChildren();
  for (const palette of COVER_PALETTES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `palette${palette.id === state.paletteId ? " active" : ""}`;
    button.dataset.id = palette.id;
    button.title = palette.label;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", palette.id === state.paletteId ? "true" : "false");
    button.style.background = `linear-gradient(155deg, ${palette.from} 0%, ${palette.to} 100%)`;
    const mark = document.createElement("span");
    mark.textContent = palette.label;
    mark.style.color = palette.accent;
    button.append(mark);
    button.addEventListener("click", () => {
      state.paletteId = palette.id;
      renderPalettes();
      updateCoverPreview();
    });
    palettesEl.append(button);
  }
}

function updateCoverPreview() {
  const palette = currentPalette();
  const hasImage = Boolean(state.coverSrc);
  coverPreview.classList.toggle("has-image", hasImage);
  coverPreview.style.background = `linear-gradient(155deg, ${palette.from} 0%, ${palette.to} 100%)`;
  coverMark.textContent = markEl.value.trim() || "aa";
  coverMark.style.color = palette.accent;
  coverYear.textContent = yearEl.value.trim() || "年份";
  if (hasImage) {
    coverPreviewImage.src = mediaUrl(state.coverSrc);
    coverPreviewImage.hidden = false;
    coverImageEl.src = mediaUrl(state.coverSrc);
    coverImageEl.hidden = false;
    coverCopy.hidden = true;
    coverClear.hidden = false;
  } else {
    coverPreviewImage.hidden = true;
    coverPreviewImage.src = "";
    coverImageEl.hidden = true;
    coverImageEl.src = "";
    coverCopy.hidden = false;
    coverClear.hidden = true;
  }
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
  state.paletteId = DEFAULT_PALETTE_ID;
  state.coverBlob = null;
  state.coverKeep = false;
  state.coverSrc = "";
  titleEl.value = "";
  slugEl.value = "";
  yearEl.value = String(new Date().getFullYear());
  featuredEl.checked = false;
  summaryEl.value = "";
  bodyEl.value = DEFAULT_BODY;
  stackEl.value = "";
  repoEl.value = "";
  urlEl.value = "";
  markEl.value = "";
  deleteBtn.hidden = true;
  previewLink.hidden = true;
  renderPalettes();
  updateCoverPreview();
  updateMarkdownPreview();
  setStatus("填好后点「保存草稿」，再到「发布与备份」选择要上线的内容。");
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
  bodyEl.value = work.body || "";
  stackEl.value = (work.stack || []).join("\n");
  repoEl.value = work.repo || "";
  urlEl.value = work.url || "";
  markEl.value = work.cover?.mark || "";
  try {
    state.paletteId = resolveCoverPalette(work.cover).id;
  } catch {
    state.paletteId = DEFAULT_PALETTE_ID;
  }
  state.coverBlob = null;
  state.coverKeep = Boolean(work.cover?.image);
  state.coverSrc = work.cover?.image || "";
  deleteBtn.hidden = false;
  previewLink.hidden = false;
  previewLink.href = `${siteOrigin()}/work/${work.slug}/`;
  renderPalettes();
  updateCoverPreview();
  updateMarkdownPreview();
  highlight(work.slug);
  setStatus(`正在编辑 ${work.slug}`);
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

function bindDrop(el, onFiles) {
  el.addEventListener("dragover", (event) => {
    event.preventDefault();
    el.classList.add("over");
  });
  el.addEventListener("dragleave", () => el.classList.remove("over"));
  el.addEventListener("drop", (event) => {
    event.preventDefault();
    el.classList.remove("over");
    onFiles(event.dataTransfer?.files);
  });
}

async function setCoverFile(file) {
  if (!file) return;
  const uploaded = await uploadFile(file);
  state.coverBlob = uploaded.id;
  state.coverKeep = false;
  state.coverSrc = uploaded.src;
  updateCoverPreview();
}

document.querySelector("#work-cover-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  await setCoverFile(file);
  event.target.value = "";
});

bindDrop(document.querySelector("#work-cover-drop"), async (files) => {
  const file = [...(files || [])].find((item) => item.type.startsWith("image/"));
  await setCoverFile(file);
});

coverClear.addEventListener("click", () => {
  state.coverBlob = null;
  state.coverKeep = false;
  state.coverSrc = "";
  updateCoverPreview();
});

bodyEl.addEventListener("input", updateMarkdownPreview);
bodyEl.addEventListener("scroll", () => {
  const max = bodyEl.scrollHeight - bodyEl.clientHeight;
  const ratio = max <= 0 ? 0 : bodyEl.scrollTop / max;
  const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
  previewEl.scrollTop = ratio * Math.max(0, previewMax);
});
bodyEl.addEventListener("keydown", (event) => {
  const meta = event.metaKey || event.ctrlKey;
  if (meta && event.key.toLowerCase() === "b") {
    event.preventDefault();
    runFormat("bold");
  }
  if (meta && event.key.toLowerCase() === "i") {
    event.preventDefault();
    runFormat("italic");
  }
});

toolbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-cmd]");
  if (!button) return;
  runFormat(button.dataset.cmd);
});

inlineImageInput.addEventListener("change", async (event) => {
  await insertImagesAtCursor(event.target.files || []);
  event.target.value = "";
});

bodyEl.addEventListener("dragover", (event) => event.preventDefault());
bodyEl.addEventListener("drop", async (event) => {
  event.preventDefault();
  const images = [...(event.dataTransfer?.files || [])].filter((file) =>
    file.type.startsWith("image/"),
  );
  if (images.length) await insertImagesAtCursor(images);
});

document.querySelector("#new-work-btn").addEventListener("click", (event) => {
  event.preventDefault();
  delete markEl.dataset.touched;
  resetForm();
  titleEl.focus();
});

deleteBtn.addEventListener("click", async () => {
  if (!state.previousSlug) return;
  if (!confirm(`删除作品 ${state.previousSlug}？会去掉 Markdown 和正文图片。`)) return;
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
    const palette = currentPalette();
    const payload = {
      title: titleEl.value.trim(),
      slug: slugEl.value.trim(),
      previousSlug: state.previousSlug,
      year: yearEl.value.trim(),
      featured: featuredEl.checked,
      order: state.order,
      summary: summaryEl.value.trim(),
      body: bodyEl.value,
      stack: stackEl.value,
      repo: repoEl.value.trim(),
      url: urlEl.value.trim(),
      cover: {
        mark: markEl.value.trim(),
        palette: palette.id,
        from: palette.from,
        to: palette.to,
        accent: palette.accent,
        ...(state.coverBlob
          ? { blob: state.coverBlob }
          : { keep: state.coverKeep }),
      },
    };
    const { work } = await api("/api/works", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.previousSlug = work.slug;
    state.order = work.order;
    bodyEl.value = work.body;
    state.coverBlob = null;
    state.coverKeep = Boolean(work.cover?.image);
    state.coverSrc = work.cover?.image || "";
    updateMarkdownPreview();
    updateCoverPreview();
    deleteBtn.hidden = false;
    previewLink.hidden = false;
    previewLink.href = `${siteOrigin()}${work.preview}`;
    await refreshList(work.slug);
    setStatus("草稿已保存在本机。打开预览确认后，到「发布与备份」选择这个作品。", "ok");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), "err");
  }
});

resetForm();
refreshList().catch((error) => setStatus(error.message, "err"));
