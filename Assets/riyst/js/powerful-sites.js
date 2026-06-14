(() => {
  "use strict";

  const qs = (sel, el=document) => el.querySelector(sel);
  const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  const input = qs("#siteSearch");
  const hint  = qs("#searchHint");
  const tiles = qsa("a.tile");
  const sections = qsa("section.stack"); // category sections
  const filterButtons = qsa('button[data-filter]');

  // Subcategory chips: show in a dedicated panel UNDER the category pills.
  // Desktop: hover to preview. Mobile: tap to open/close.
  const catNav = qs('nav.catnav[aria-label="Categories"]');
  const subPanel = qs('#subcatPanel');
  
  // Subcategory panel needs to (1) appear directly under the active parent chip,
  // and (2) push the search bar down (no overlap). We do this by:
  // - rendering the panel absolutely (for anchoring)
  // - using a spacer element in normal flow to reserve its height.
  let subSlot = null;
  let subSpacer = null;
  let lastSpacerHeight = 0;

  const ensureSubSlot = () => {
    if (!subPanel) return;
    if (subPanel.parentElement && subPanel.parentElement.classList && subPanel.parentElement.classList.contains('subcat-slot')) {
      subSlot = subPanel.parentElement;
      subSpacer = qs('#subcatSpacer', subSlot.parentElement) || null;
      return;
    }
    // Create: <div class="subcat-slot"></div><div id="subcatSpacer" class="subcat-spacer"></div>
    const slot = document.createElement('div');
    slot.className = 'subcat-slot';
    const spacer = document.createElement('div');
    spacer.id = 'subcatSpacer';
    spacer.className = 'subcat-spacer';
    spacer.style.height = '0px';

    const parent = subPanel.parentElement;
    if (!parent) return;
    parent.insertBefore(slot, subPanel);
    slot.appendChild(subPanel);
    parent.insertBefore(spacer, slot.nextSibling);

    subSlot = slot;
    subSpacer = spacer;
  };

const chipwraps = qsa('.chipwrap.chip--with-sub');


  // Mark parent chips that have subcategories (used for sizing so dropdown isn't squashed)
  chipwraps.forEach(w => {
    const t = qs('a.chip', w);
    if (t) t.classList.add('has-subcats');
  });

  const hoverFine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  let activeWrap = null;
  let hideTimer = null;
  let positionRaf = null;

  const closePanel = () => {
    activeWrap = null;
    if (subPanel) {
      subPanel.classList.remove('is-open');
    // reset open chip styling + spacer
    qsa('a.chip.chip-open', catNav).forEach(a => a.classList.remove('chip-open'));
    if (subSpacer) subSpacer.style.height = '0px';
      subPanel.innerHTML = '';
    }
    chipwraps.forEach(w => {
      w.classList.remove('is-open');
      const t = qs('a.chip', w);
      if (t) t.setAttribute('aria-expanded','false');
  });

  // Hide subcategory chips inside each parent dropdown when their target subcategory is empty.
  if (catNav) {
    qsa('.chip-dropdown a.chip', catNav).forEach(a => {
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#sub-')) { a.hidden = false; return; }
      const target = document.getElementById(href.slice(1));
      if (!target) { a.hidden = false; return; }
      a.hidden = !!target.hidden;
    });
  }
};

  const cancelHide = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const scheduleHide = () => {
    cancelHide();
    hideTimer = setTimeout(() => closePanel(), 140);
  };

  const openFor = (wrap) => {
    if (!subPanel) return;
    if (activeWrap === wrap && subPanel.classList.contains('is-open')) {
      // already open for this wrap
      return;
    }
    const links = qsa('.chip-dropdown a.chip', wrap);
    if (!links.length) {
      closePanel();
      return;
    }

    // Build a stacked panel that looks like a grouped refinement area.
    const items = links.map(a => {
      const href = a.getAttribute('href') || '#';
      const text = (a.textContent || '').trim();
      return `<a class="chip" href="${href}">${escapeHtml(text)}</a>`;
    }).join('');

    subPanel.innerHTML = `<div class="subcat-label">Refine your search</div>${items}`;

    subPanel.classList.add('is-open');
    activeWrap = wrap;

    // Position the panel under the hovered/clicked category chip.
    // Clear any previously 'open' chip styling so only one pill is arched.
    qsa('a.chip.chip-open', catNav).forEach(a => a.classList.remove('chip-open'));
    // Positioning can be expensive; coalesce to the next animation frame for smoothness.
    if (positionRaf) cancelAnimationFrame(positionRaf);
    positionRaf = requestAnimationFrame(() => positionPanel(wrap));


    chipwraps.forEach(w => w.classList.toggle('is-open', w === wrap));
    const t = qs('a.chip', wrap);
    if (t) t.setAttribute('aria-expanded','true');
  };

  const positionPanel = (wrap) => {
    if (!subPanel || !catNav) return;

    // We still keep the "spacer" so the search bar/content below is pushed down.
    ensureSubSlot();

    const trigger = qs('a.chip', wrap);
    if (!trigger) return;

    // Keep the panel inside the dedicated slot (in normal flow)
    // but position it so it aligns under the active parent chip.
    // This avoids flex-wrap edge cases where the panel can "drift".
    if (!subSlot) return;

    const trigRect = trigger.getBoundingClientRect();
    const slotRect = subSlot.getBoundingClientRect();

    // Match the parent chip exactly for a seamless "expanding" feel
    const panelW = Math.max(64, trigRect.width);
    subPanel.style.width = `${panelW}px`;

    // Align the panel's left edge with the parent chip's left edge (relative to the slot)
    let left = (trigRect.left - slotRect.left);

    // Clamp only to prevent overflow off the slot (keeps alignment when possible)
    const maxLeft = (slotRect.width - panelW);
    if (left < 0) left = 0;
    if (left > maxLeft) left = maxLeft;
    subPanel.style.left = `${left}px`;

    // Attach the panel seamlessly to the bottom of the active chip.
    const top = (trigRect.bottom - slotRect.top) - 1; // overlap 1px for seamless join
    subPanel.style.top = `${top}px`;

    // Ensure only the active chip appears "open"
    qsa('a.chip.chip-open', catNav).forEach(a => a.classList.remove('chip-open'));
    trigger.classList.add('chip-open');

    // Reserve space so the search bar and content below are pushed down
    // Reserve space so the search bar and content below are pushed down
    if (subSpacer) {
      const h = subPanel.offsetHeight || 0;
      const needed = Math.max(0, (top + h)) + 12;
      if (Math.abs(lastSpacerHeight - needed) > 1) {
        subSpacer.style.height = `${needed}px`;
        lastSpacerHeight = needed;
      }
    }

    // Close when selecting a subcategory
    subPanel.addEventListener('click', (e) => {
      const a = e.target.closest('a.chip');
      if (a && !hoverFine) closePanel();
    });

    // Close on outside click / Escape (mainly for mobile)
    document.addEventListener('click', (e) => {
      if (hoverFine) return;
      const inside = e.target.closest('nav.catnav[aria-label="Categories"]') || e.target.closest('#subcatPanel');
      if (!inside) closePanel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePanel();
    });

    // Keep the panel aligned under the active chip on resize.
    window.addEventListener('resize', () => {
      if (activeWrap && subPanel.classList.contains('is-open')) positionPanel(activeWrap);
    });
  }

  if (!input || !tiles.length) return;

  let activeTag = null; // 'ai' | 'non-ai' | 'free' | 'paid' | null

  const norm = (s) => (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  // Precompute searchable text per tile (title + desc + data-tags + chip text)
  const tileIndex = tiles.map(tile => {
    const title = qs(".tile__title", tile)?.textContent || "";
    const desc  = qs(".tile__desc", tile)?.textContent || "";
    const tags  = tile.getAttribute("data-tags") || "";
    const chips = qsa(".chip", tile).map(c => c.textContent).join(" ");
    return { tile, haystack: norm([title, desc, tags, chips].join(" ")) };
  });

  const setVisible = (el, on) => {
    el.hidden = !on;
    el.style.display = on ? "" : "none";
  };

  const updateSectionsVisibility = () => {
    sections.forEach(sec => {
      // Hide subcategory titles (h4.subcategory-title) when their following tiles are all hidden.
      const grids = qsa(".grid.tiles", sec);
      grids.forEach(grid => {
        const kids = Array.from(grid.children);
        for (let i = 0; i < kids.length; i++) {
          const el = kids[i];
          if (!(el && el.classList && el.classList.contains("subcategory-title"))) continue;

          let anyVisible = false;
          for (let j = i + 1; j < kids.length; j++) {
            const nxt = kids[j];
            if (nxt.classList && nxt.classList.contains("subcategory-title")) break;
            if (nxt.matches && nxt.matches("a.tile") && !nxt.hidden) { anyVisible = true; break; }
          }
          setVisible(el, anyVisible);
        }
      });

      const visibleCount = qsa("a.tile", sec).filter(t => !t.hidden).length;
      setVisible(sec, visibleCount > 0);
  });

  // Hide subcategory chips inside each parent dropdown when their target subcategory is empty.
  if (catNav) {
    qsa('.chip-dropdown a.chip', catNav).forEach(a => {
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#sub-')) { a.hidden = false; return; }
      const target = document.getElementById(href.slice(1));
      if (!target) { a.hidden = false; return; }
      a.hidden = !!target.hidden;
    });
  }
};


  const updateHint = (shown, total, term) => {
    if (!hint) return;
    const t = norm(term);
    if (!t && !activeTag) {
      hint.textContent = "";
      return;
    }
    const parts = [];
    if (t) parts.push(`"${term}"`);
    if (activeTag) parts.push(activeTag.toUpperCase());
    const suffix = parts.length ? ` for ${parts.join(" + ")}` : "";
    hint.textContent = `Showing ${shown} of ${total}${suffix}.`;
  };

  const applyFilters = () => {
    const term = input.value || "";
    const nterm = norm(term);

    let shown = 0;
    for (const {tile, haystack} of tileIndex) {
      const matchText = !nterm || haystack.includes(nterm);
      const matchTag  = !activeTag || (tile.getAttribute("data-tags") || "").split(/\s+/).includes(activeTag);
      const on = matchText && matchTag;
      setVisible(tile, on);
      if (on) shown++;
    }

    updateSectionsVisibility();
    updateHint(shown, tiles.length, term);
  };

  // Wire up tag filter buttons (AI / Non-AI / Free / Paid)
  if (filterButtons.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tag = btn.getAttribute("data-filter");
        const willActivate = activeTag !== tag;
        activeTag = willActivate ? tag : null;

        filterButtons.forEach(b => {
          const isOn = (activeTag && b.getAttribute("data-filter") === activeTag);
          b.setAttribute("aria-pressed", isOn ? "true" : "false");
          b.classList.toggle("is-active", !!isOn);
        });

        applyFilters();
      });
    });
  }

  // Live search
  input.addEventListener("input", applyFilters);

  // Initial state
  applyFilters();

  // Reveal-on-scroll (optional, safe if elements exist)
  const reveals = qsa("[data-reveal]");
  if (reveals.length) {
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      reveals.forEach(el => el.classList.add("is-visible"));
    } else if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(ent => {
          if (ent.isIntersecting) {
            ent.target.classList.add("is-visible");
            io.unobserve(ent.target);
          }
        });
      }, { threshold: 0.1 });
      reveals.forEach(el => io.observe(el));
    } else {
      reveals.forEach(el => el.classList.add("is-visible"));
    }
  }

  // Back-to-top (if present)
  const topBtn = qs("[data-back-to-top], #backToTop, .back-to-top");
  if (topBtn) {
    const onScroll = () => {
      const show = window.scrollY > 600;
      topBtn.classList.toggle("show", show);
      topBtn.setAttribute("aria-hidden", show ? "false" : "true");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    topBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();