function setMode(mode) {
  const previousMode = document.body.dataset.mode;
  const works = mode === "works";
  const publishing = mode === "publishing";
  document.body.dataset.mode = publishing ? "publishing" : works ? "works" : "articles";
  document.querySelector("main.layout").hidden = publishing;
  document.querySelector("#publishing-panel").hidden = !publishing;
  document.querySelector("#form").hidden = works;
  document.querySelector("#article-side").hidden = works;
  document.querySelector("#work-form").hidden = !works;
  document.querySelector("#work-side").hidden = !works;
  document.querySelector("#studio-title").textContent = publishing ? "发布与备份" : works ? "作品工坊" : "文章工坊";
  document.title = document.querySelector("#studio-title").textContent;
  for (const tab of document.querySelectorAll(".modes [data-mode]")) {
    const selected = tab.dataset.mode === document.body.dataset.mode;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", selected ? "true" : "false");
  }
  const hash = `#${document.body.dataset.mode}`;
  if (location.hash !== hash) history.replaceState(null, "", hash);
  if (publishing) window.dispatchEvent(new Event("publishing-open"));
  if (previousMode !== document.body.dataset.mode) window.scrollTo({ top: 0 });
}

function modeFromHash() {
  return location.hash === "#publishing" ? "publishing" : location.hash === "#works" ? "works" : "articles";
}

for (const tab of document.querySelectorAll(".modes [data-mode]")) {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
}

window.addEventListener("hashchange", () => setMode(modeFromHash()));
setMode(modeFromHash());
