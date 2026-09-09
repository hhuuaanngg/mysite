const form = document.querySelector("#form");
const listEl = document.querySelector("#article-list");
const titleEl = document.querySelector("#title");
const slugEl = document.querySelector("#slug");
const categoryEl = document.querySelector("#category");
const dateEl = document.querySelector("#date");
const summaryEl = document.querySelector("#summary");
const bodyEl = document.querySelector("#body");
const allowEmptyEl = document.querySelector("#allow-empty");
const statusEl = document.querySelector("#status");
const previewLink = document.querySelector("#preview-link");
const deleteBtn = document.querySelector("#delete-btn");
const coverPreview = document.querySelector("#cover-preview");
const coverCopy = document.querySelector("#cover-copy");
const galleryList = document.querySelector("#gallery-list");

const state = {
  previousSlug: "",
  slugTouched: false,
  coverBlob: null,
  coverKeep: false,
  gallery: [],
};

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = `status ${kind}`.trim();
}

function today() {
  return new Date().toISOString().slice(0, 10);
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

function mediaUrl(src) {
  if (!src) return "";
  if (src.startsWith("/__blob__/")) {
    const id = src.slice("/__blob__/".length).replace(/\.[a-z0-9]+$/i, "");
    return `/api/blobs/${id}`;
  }
  if (src.startsWith("/articles/")) return `/media${src}`;
  return src;
}

function parseImages(markdown) {
  return [...markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map((match) => ({
    alt: match[1],
    src: match[2].trim(),
    raw: match[0],
  }));
}

async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}

async function uploadFile(file) {
  const id = crypto.randomUUID().replaceAll("-", "");
  const result = await api(`/api/blobs/${id}?name=${encodeURIComponent(file.name)}`, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  return result;
}

function renderGallery() {
  galleryList.replaceChildren();
  for (const item of state.gallery) {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = mediaUrl(item.src);
    img.alt = item.alt || "";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.gallery = state.gallery.filter((entry) => entry.src !== item.src);
      bodyEl.value = bodyEl.value.split(item.raw || `![](${item.src})`).join("").replace(/\n{3,}/g, "\n\n");
      renderGallery();
    });
    li.append(img, remove);
    galleryList.append(li);
  }
}

function syncGalleryFromBody() {
  state.gallery = parseImages(bodyEl.value);
  renderGallery();
}

function resetForm() {
  state.previousSlug = "";
  state.slugTouched = false;
  state.coverBlob = null;
  state.coverKeep = false;
  state.gallery = [];
  titleEl.value = "";
  slugEl.value = "";
  categoryEl.value = "摄影";
  dateEl.value = today();
  summaryEl.value = "";
  bodyEl.value = "";
  allowEmptyEl.checked = false;
  coverPreview.hidden = true;
  coverPreview.src = "";
  coverCopy.hidden = false;
  deleteBtn.hidden = true;
  previewLink.hidden = true;
  renderGallery();
  setStatus("填好后点「保存到仓库」，会生成 md / 封面 / 相册。");
  highlight("");
}

function highlight(slug) {
  for (const button of listEl.querySelectorAll("button")) {
    button.classList.toggle("active", button.dataset.slug === slug);
  }
}

async function refreshList(activeSlug = "") {
  const { articles } = await api("/api/articles");
  listEl.replaceChildren();
  for (const article of articles) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.slug = article.slug;
    button.innerHTML = "";
    const title = document.createElement("strong");
    title.textContent = article.title;
    const meta = document.createElement("small");
    meta.textContent = `${article.category} · ${article.date}`;
    button.append(title, meta);
    button.addEventListener("click", () => loadArticle(article.slug));
    item.append(button);
    listEl.append(item);
  }
  highlight(activeSlug);
}

async function loadArticle(slug) {
  const { article } = await api(`/api/articles/${slug}`);
  state.previousSlug = article.slug;
  state.slugTouched = true;
  state.coverBlob = null;
  state.coverKeep = Boolean(article.cover);
  titleEl.value = article.title;
  slugEl.value = article.slug;
  categoryEl.value = article.category || "摄影";
  dateEl.value = article.date;
  summaryEl.value = article.summary;
  bodyEl.value = article.body;
  allowEmptyEl.checked = false;
  if (article.cover) {
    coverPreview.src = mediaUrl(article.cover);
    coverPreview.hidden = false;
    coverCopy.hidden = true;
  } else {
    coverPreview.hidden = true;
    coverCopy.hidden = false;
  }
  deleteBtn.hidden = false;
  previewLink.hidden = false;
  previewLink.href = `http://127.0.0.1:3000/articles/${article.slug}/`;
  syncGalleryFromBody();
  highlight(article.slug);
  setStatus(`正在编辑 ${article.slug}`);
}

async function addGalleryFiles(files) {
  for (const file of files) {
    const uploaded = await uploadFile(file);
    const raw = `![](${uploaded.src})`;
    bodyEl.value = `${bodyEl.value.trim()}\n\n${raw}\n`;
  }
  syncGalleryFromBody();
}

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

titleEl.addEventListener("input", () => {
  if (!state.slugTouched) slugEl.value = slugify(titleEl.value);
});

slugEl.addEventListener("input", () => {
  state.slugTouched = true;
});

bodyEl.addEventListener("input", syncGalleryFromBody);

document.querySelector("#cover-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const uploaded = await uploadFile(file);
  state.coverBlob = uploaded.id;
  state.coverKeep = false;
  coverPreview.src = mediaUrl(uploaded.src);
  coverPreview.hidden = false;
  coverCopy.hidden = true;
});

document.querySelector("#gallery-input").addEventListener("change", async (event) => {
  await addGalleryFiles(event.target.files || []);
  event.target.value = "";
});

bindDrop(document.querySelector("#cover-drop"), async (files) => {
  const file = files?.[0];
  if (!file) return;
  const uploaded = await uploadFile(file);
  state.coverBlob = uploaded.id;
  state.coverKeep = false;
  coverPreview.src = mediaUrl(uploaded.src);
  coverPreview.hidden = false;
  coverCopy.hidden = true;
});

bindDrop(document.querySelector("#gallery-drop"), async (files) => {
  await addGalleryFiles(files || []);
});

document.querySelector("#new-btn").addEventListener("click", (event) => {
  event.preventDefault();
  resetForm();
  titleEl.focus();
});

deleteBtn.addEventListener("click", async () => {
  if (!state.previousSlug) return;
  if (!confirm(`删除 ${state.previousSlug}？Markdown 和图片都会去掉。`)) return;
  await api(`/api/articles/${state.previousSlug}`, { method: "DELETE" });
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
      category: categoryEl.value,
      date: dateEl.value,
      summary: summaryEl.value.trim(),
      body: bodyEl.value,
      allowEmpty: allowEmptyEl.checked,
      cover: state.coverBlob
        ? { blob: state.coverBlob }
        : { keep: state.coverKeep },
    };
    const { article } = await api("/api/articles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.previousSlug = article.slug;
    state.coverBlob = null;
    state.coverKeep = Boolean(article.cover);
    bodyEl.value = article.body;
    syncGalleryFromBody();
    deleteBtn.hidden = false;
    previewLink.hidden = false;
    previewLink.href = `http://127.0.0.1:3000${article.preview}`;
    await refreshList(article.slug);
    setStatus(
      `已生成 ${article.files.join("、")}。打开预览确认后，提交 git 即可发布。`,
      "ok",
    );
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), "err");
  }
});

resetForm();
refreshList().catch((error) => setStatus(error.message, "err"));
