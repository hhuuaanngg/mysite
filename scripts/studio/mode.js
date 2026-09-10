function setMode(mode) {
  const works = mode === "works";
  document.body.dataset.mode = works ? "works" : "articles";
  document.querySelector("#form").hidden = works;
  document.querySelector("#article-side").hidden = works;
  document.querySelector("#work-form").hidden = !works;
  document.querySelector("#work-side").hidden = !works;
  document.querySelector("#studio-title").textContent = works ? "作品工坊" : "文章工坊";
  document.title = works ? "作品工坊" : "文章工坊";
  for (const tab of document.querySelectorAll(".modes [data-mode]")) {
    const selected = tab.dataset.mode === (works ? "works" : "articles");
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", selected ? "true" : "false");
  }
  const hash = works ? "#works" : "#articles";
  if (location.hash !== hash) history.replaceState(null, "", hash);
}

function modeFromHash() {
  return location.hash === "#works" ? "works" : "articles";
}

for (const tab of document.querySelectorAll(".modes [data-mode]")) {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
}

window.addEventListener("hashchange", () => setMode(modeFromHash()));
setMode(modeFromHash());
