/*
  webmaster.js — appended override for fgRenderRoster to render image-enabled cards
  (This file already contains a previous fgRenderRoster; this declaration will replace it.)
*/

function fgRenderRoster(id, data, emptyMsg) {
  const list = document.getElementById(id);
  if (!list) return;

  if (!data.length) {
    list.outerHTML = `<p class="fg-empty">${escHtml(emptyMsg)}</p>`;
    return;
  }

  list.innerHTML = data
    .map((c) => {
      const label = c.label ? `<span class="fg-roster-label">${escHtml(c.label)}</span>` : "";
      const source = c.source ? `<span class="fg-roster-source">${escHtml(c.source)}</span>` : "";
      const tags = (c.tags || [])
        .map((t) => `<span class="fg-tag is-${escHtml(t)}">${escHtml(FG_TAG_LABELS?.[t] || t)}</span>`)
        .join("");
      const visual = c.img
        ? `<img src="${escHtml(c.img)}" alt="${escHtml(c.name)}" loading="lazy" onerror="this.closest('.fg-chara-img').classList.add('is-empty');this.remove();" />`
        : "";
      const blurb = c.note ? escHtml(c.note) : "";

      return `<li class="fg-roster-item">
        <article class="fg-chara">
          <div class="fg-chara-img${c.img ? "" : " is-empty"}">${visual}</div>
          <div class="fg-chara-meta">
            <span class="fg-chara-name">${escHtml(c.name)}</span>
            ${source}
          </div>
          ${tags ? `<div class="fg-chara-tags">${tags}</div>` : ""}
          <div class="fg-chara-blurb-wrap">
            <p class="fg-chara-blurb">${blurb}</p>
          </div>
          ${label ? `<div class="fg-roster-meta">${label}</div>` : ""}
        </article>
      </li>`;
    })
    .join("");

  list.querySelectorAll(".fg-chara-blurb").forEach((p) => {
    const wrap = p.parentElement;
    if (p.scrollHeight <= p.clientHeight + 1) return;
    p.tabIndex = 0;
    p.setAttribute("role", "region");
    p.setAttribute("aria-label", "character notes, scrollable");
    wrap.classList.add("is-clipped");
    p.addEventListener("scroll", () => {
      const atEnd = p.scrollTop + p.clientHeight >= p.scrollHeight - 2;
      wrap.classList.toggle("is-ended", atEnd);
    });
  });

  const count = document.getElementById("fgCount");
  if (count) {
    count.textContent = data.length === 1 ? "1 entry" : `${data.length} entries`;
  }
}
