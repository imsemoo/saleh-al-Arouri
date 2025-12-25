/**
 * ------------------------------------------------------------
 * Global UI Initializers (Vanilla JS + Bootstrap + optional libs)
 * ------------------------------------------------------------
 * Principles:
 * - Small, focused functions (single responsibility).
 * - Defensive checks for optional dependencies (Bootstrap / jQuery / OwlCarousel / Plyr).
 * - Dataset-driven UI: HTML remains the source of truth.
 * - Accessibility: keyboard support + aria attributes where relevant.
 *
 * This file is intended for a static site (multi-page) and is safe to include on all pages.
 */

/* ============================================================
   0) Utilities
============================================================ */

const ACTIVATION_KEYS = ["Enter", " "];

const safeStorageGet = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};

const safeStorageSet = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch { /* ignore */ }
};

const handleActivation = (event, handler) => {
  if (event.type === "keydown") {
    if (!ACTIVATION_KEYS.includes(event.key)) return;
    event.preventDefault();
  }
  handler();
};

/* ============================================================
   1) Navigation Active Link
============================================================ */

const setActiveNavLink = () => {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".c-nav__link").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const targetFile = href.split("/").pop();
    const isActive = targetFile === currentFile;

    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
};

/* ============================================================
   2) Generic Tabs
============================================================ */

const initTabs = () => {
  const roots = new Set();

  document.querySelectorAll("[data-tabs-root]").forEach((r) => roots.add(r));

  document.querySelectorAll("[data-tabs]").forEach((tabsEl) => {
    const inferred =
      tabsEl.closest("[data-tabs-root]") ||
      tabsEl.closest(".c-bio-tabs__wrap") ||
      tabsEl.closest(".c-tabs-area") ||
      tabsEl.closest(".c-bio-tabs") ||
      tabsEl.closest(".c-tabs") ||
      document.body;

    roots.add(inferred);
  });

  roots.forEach((root) => {
    const tabsContainer =
      root.querySelector("[data-tabs]") ||
      root.querySelector(".c-bio-tabs__tabs") ||
      root.querySelector(".c-tabs");

    if (!tabsContainer) return;

    const tabs = Array.from(tabsContainer.querySelectorAll(".c-tab"));
    const panels = Array.from(root.querySelectorAll(".c-tab-panel"));
    if (!tabs.length || !panels.length) return;

    const activateTab = (tabEl) => {
      const key = tabEl.getAttribute("data-tab-target");
      if (!key) return;

      tabs.forEach((t) => t.classList.toggle("is-active", t === tabEl));
      panels.forEach((p) => {
        const show = p.getAttribute("data-tab-panel") === key;
        p.classList.toggle("is-visible", show);
      });
    };

    tabs.forEach((tab, idx) => {
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (e) => handleActivation(e, () => activateTab(tab)));
      if (idx === 0) activateTab(tab);
    });
  });
};

/* ============================================================
   3) Optional OwlCarousel (Hero)
============================================================ */

const initHeroCarousel = () => {
  const hasJQ = !!window.jQuery;
  const hasOwl = hasJQ && !!window.jQuery.fn?.owlCarousel;
  if (!hasOwl) return;

  const $carousel = window.jQuery(".js-hero-carousel");
  if (!$carousel.length) return;

  $carousel.owlCarousel({
    loop: true,
    margin: 24,
    nav: false,
    dots: true,
    autoplay: true,
    autoplayTimeout: 7000,
    responsive: {
      0: { items: 1 },
      768: { items: 2 },
    },
  });
};

/* ============================================================
   4) Bootstrap Modal Helper
============================================================ */

const modalHelper = {
  open(id) {
    const modalEl = document.getElementById(id);
    if (!modalEl || !window.bootstrap?.Modal) return;
    const modal = new window.bootstrap.Modal(modalEl);
    modal.show();
  },
};

/* ============================================================
   5) Media Detail Modal (delegated + backend-ready)
============================================================ */

const initMediaModals = () => {
  const modalEl = document.getElementById("mediaDetailModal");
  if (!modalEl || !window.bootstrap?.Modal) return;

  const $ = (sel) => modalEl.querySelector(sel);

  const ui = {
    badge: $("[data-modal-badge-target]"),
    title: $("[data-modal-title-target]"),
    desc: $("[data-modal-description-target]"),
    time: $("[data-modal-timestamp-target]"),
    source: $("[data-modal-source-target]"),
    kindChip: $("[data-modal-kind-target]"),
    durationChip: $("[data-modal-duration-target]"),
    locationChip: $("[data-modal-location-target]"),
    kind2: $("[data-modal-kind2-target]"),
    date: $("[data-modal-date-target]"),
    source2: $("[data-modal-source2-target]"),
    tag: $("[data-modal-tag-target]"),
    img: $("[data-modal-image-target]"),
    videoMount: $("[data-modal-video-mount]"),
    fallbackFigure: modalEl.querySelector(".c-modal__fallback"),
  };

  const defaults = {
    title: "أرشيف الوسائط",
    description: "مادة مختارة ضمن توثيق بصري وسمعي.",
    badge: "",
    timestamp: "",
    source: "",
    image: "assets/img/articles/thumb1.png",
    kind: "وسائط",
    kindLabel: "—",
    dateText: "—",
    tag: "—",
  };

  const bsModal = window.bootstrap.Modal.getOrCreateInstance(modalEl);

  const safeText = (el, value, fallback = "") => {
    if (!el) return;
    el.textContent = value ?? fallback;
  };

  const setHidden = (el, hidden) => {
    if (!el) return;
    el.hidden = !!hidden;
  };

  const clearMount = () => {
    if (ui.videoMount) ui.videoMount.innerHTML = "";
  };

  const showFallbackImage = (show) => {
    if (!ui.fallbackFigure) return;
    ui.fallbackFigure.style.display = show ? "" : "none";
  };

  const resolveKind = (d) => {
    const t = (d.mediaType || d.modalBadge || "").toLowerCase();
    if (t.includes("reel") || t.includes("ريل")) return { key: "reel", label: "ريل" };
    if (t.includes("video") || t.includes("فيديو")) return { key: "video", label: "فيديو" };
    if (t.includes("audio") || t.includes("صوت")) return { key: "audio", label: "صوت" };
    if (t.includes("photo") || t.includes("صورة")) return { key: "photo", label: "صورة" };
    return { key: "media", label: "وسائط" };
  };

  const renderMedia = (d) => {
    clearMount();

    const poster = d.modalImage || defaults.image;
    const videoUrl = d.modalVideo || "";
    const kind = resolveKind(d).key;

    if (ui.img) {
      ui.img.src = poster;
      ui.img.alt = d.modalTitle || defaults.title;
    }

    if (!videoUrl || kind === "photo" || kind === "audio") {
      showFallbackImage(true);
      modalEl.classList.remove("has-video");
      return;
    }

    if (!ui.videoMount) return;

    const isMp4 = /\.mp4(\?|$)/i.test(videoUrl);
    const isEmbed = /youtube\.com\/embed|player\.vimeo\.com|https?:\/\//i.test(videoUrl) && !isMp4;

    modalEl.classList.add("has-video");

    if (isEmbed) {
      const iframe = document.createElement("iframe");
      iframe.src = videoUrl;
      iframe.title = "Video player";
      iframe.className = "c-modal__video-frame";
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "true");
      ui.videoMount.appendChild(iframe);
      showFallbackImage(false);
      return;
    }

    const video = document.createElement("video");
    video.className = "c-modal__video-player";
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.poster = poster;

    const source = document.createElement("source");
    source.src = videoUrl;
    source.type = "video/mp4";

    video.appendChild(source);
    ui.videoMount.appendChild(video);

    // Force load after mount
    try { video.load(); } catch { }

    showFallbackImage(false);

    // IMPORTANT: some browsers need a layout tick after modal shown
    modalEl.addEventListener(
      "shown.bs.modal",
      () => {
        try { video.load(); } catch { }
      },
      { once: true }
    );
  };

  const updateModal = (d) => {
    const kind = resolveKind(d);

    safeText(ui.title, d.modalTitle, defaults.title);
    safeText(ui.desc, d.modalDescription, defaults.description);
    safeText(ui.badge, d.modalBadge || kind.label, defaults.badge);
    safeText(ui.time, d.modalTimestamp, defaults.timestamp);
    safeText(ui.source, d.modalSource, defaults.source);

    safeText(ui.kindChip, kind.label, defaults.kind);

    const duration = d.mediaDuration || d.modalDuration || "";
    const location = d.mediaLocation || d.modalLocation || "";

    if (ui.durationChip) {
      safeText(ui.durationChip, `المدة: ${duration}`, "المدة: —");
      setHidden(ui.durationChip, !duration);
    }
    if (ui.locationChip) {
      safeText(ui.locationChip, `المكان: ${location}`, "المكان: —");
      setHidden(ui.locationChip, !location);
    }

    safeText(ui.kind2, kind.label, defaults.kindLabel);
    const isoDate = d.mediaDate || d.modalDate || "";
    safeText(ui.date, isoDate || d.modalTimestamp || defaults.dateText, defaults.dateText);
    safeText(ui.source2, d.modalSource || defaults.source, defaults.source);
    safeText(ui.tag, d.mediaTag || d.modalTag || defaults.tag, defaults.tag);

    renderMedia(d);
    bsModal.show();
  };

  modalEl.addEventListener("hidden.bs.modal", () => {
    clearMount();
    showFallbackImage(true);
  });

  const isActivationKey = (e) => e.key === "Enter" || e.key === " ";

  const handleTrigger = (trigger, event) => {
    if (event.type === "keydown" && !isActivationKey(event)) return;
    if (event.type === "keydown") event.preventDefault();
    updateModal(trigger.dataset);
  };

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-media-card]");
    if (!trigger) return;
    handleTrigger(trigger, e);
  });

  document.addEventListener("keydown", (e) => {
    const trigger = e.target.closest("[data-media-card][role='button']");
    if (!trigger) return;
    handleTrigger(trigger, e);
  });
};

/* ============================================================
   6) Collection Navigation (delegated)
============================================================ */

const initCollectionNavigation = () => {
  const container = document.querySelector(".c-collection-grid");
  if (!container) return;

  const navigate = (url) => { if (url) window.location.href = url; };

  container.addEventListener("click", (event) => {
    const card = event.target.closest("[data-collection-link]");
    if (!card) return;
    event.preventDefault();
    navigate(card.dataset.collectionLink);
  });

  container.addEventListener("keydown", (event) => {
    if (!ACTIVATION_KEYS.includes(event.key)) return;
    const card = event.target.closest("[data-collection-link]");
    if (!card) return;
    event.preventDefault();
    navigate(card.dataset.collectionLink);
  });
};

/* ============================================================
   7) Header Scroll State
============================================================ */

const initHeaderScrollState = () => {
  const header = document.querySelector(".c-header");
  if (!header) return;

  const update = () => header.classList.toggle("c-header--scrolled", window.scrollY > 10);

  window.addEventListener("scroll", update, { passive: true });
  update();
};

/* ============================================================
   8) Theme Toggle (Fixed: System Dark won't override Light)
============================================================ */

const THEME_STORAGE_KEY = "salehThemePreference";
const themePrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)");

/**
 * Update toggle visuals (icon + aria)
 * @param {boolean} isDark
 */
const updateThemeToggleVisual = (isDark) => {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  toggle.setAttribute("aria-pressed", String(isDark));
  toggle.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");

  const icon = toggle.querySelector("[data-theme-icon]");
  if (!icon) return;

  icon.classList.toggle("fa-sun", isDark);
  icon.classList.toggle("fa-moon", !isDark);
};

/**
 * Apply theme:
 * - "dark"  => html[data-theme="dark"]
 * - "light" => html[data-theme="light"]  (IMPORTANT: explicit!)
 * - "system" => remove attribute (follow OS)
 */
const applyColorTheme = (variant, { persist = false } = {}) => {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  let effective = variant;

  if (variant === "system") {
    const systemIsDark = !!themePrefersDark?.matches;
    effective = systemIsDark ? "dark" : "light";
    root.removeAttribute("data-theme"); // allow CSS prefers-color-scheme if you use it
  } else {
    // IMPORTANT FIX:
    // Set explicit "light" when light, do NOT remove attribute.
    root.setAttribute("data-theme", variant);
  }

  const isDark = effective === "dark";
  body.classList.toggle("is-dark", isDark);

  updateThemeToggleVisual(isDark);

  if (persist) {
    // store only "dark" | "light" | "system"
    safeStorageSet(THEME_STORAGE_KEY, variant);
  }
};

/**
 * OS theme changes should only affect UI when user didn't pick manual theme,
 * or explicitly set "system".
 */
const handleSystemThemeChange = () => {
  const stored = safeStorageGet(THEME_STORAGE_KEY);
  if (stored && stored !== "system") return; // user forced light/dark
  applyColorTheme("system");
};

const initThemeToggle = () => {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const stored = safeStorageGet(THEME_STORAGE_KEY);

    // If user never chose => start from system then toggle to opposite
    // But simplest UX: toggle between light/dark only.
    // Determine current effective theme:
    const isCurrentlyDark =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      (document.documentElement.hasAttribute("data-theme") === false && !!themePrefersDark?.matches);

    const next = isCurrentlyDark ? "light" : "dark";
    applyColorTheme(next, { persist: true });
  });
};

const bootTheme = () => {
  const stored = safeStorageGet(THEME_STORAGE_KEY); // "dark" | "light" | "system" | null
  const initial = stored || "system";

  applyColorTheme(initial);

  if (themePrefersDark?.addEventListener) {
    themePrefersDark.addEventListener("change", handleSystemThemeChange);
  } else if (themePrefersDark?.addListener) {
    themePrefersDark.addListener(handleSystemThemeChange);
  }
};

/* ============================================================
   9) Milestone Cards
============================================================ */

const initMilestoneCards = () => {
  document.querySelectorAll(".c-milestone").forEach((card) => {
    const trigger = card.querySelector("[data-media-card]");
    if (!trigger) return;

    card.addEventListener("click", (e) => {
      const isInteractive = e.target.closest("button, a, [data-media-card]");
      if (isInteractive) return;
      trigger.click();
    });
  });
};

/* ============================================================
   10) Persona Flip + Media Tabs
============================================================ */

const initPersonaFlip = () => {
  document.querySelectorAll("[data-persona-flip]").forEach((card) => {
    const pauseMedia = () => {
      card.querySelectorAll("video, audio").forEach((m) => {
        try { m.pause(); } catch { }
      });
    };

    const toFront = () => { card.classList.remove("is-flipped"); pauseMedia(); };
    const toBack = () => { card.classList.add("is-flipped"); };

    card.querySelectorAll("[data-flip-to]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const target = btn.getAttribute("data-flip-to");
        if (target === "back") toBack();
        else toFront();
      });
    });

    card.setAttribute("data-flip-mode", "button");
    if (card.hasAttribute("tabindex")) card.removeAttribute("tabindex");
  });
};

const initPersonaMediaTabs = () => {
  document.querySelectorAll("[data-persona-media]").forEach((root) => {
    const tabs = Array.from(root.querySelectorAll("[data-persona-tab]"));
    const panels =
      Array.from(root.closest(".c-persona__back")?.querySelectorAll("[data-persona-panel]") || []) ||
      Array.from(root.parentElement?.querySelectorAll("[data-persona-panel]") || []);

    if (!tabs.length || !panels.length) return;

    const pauseHiddenPanelMedia = () => {
      panels.forEach((panel) => {
        if (!panel.classList.contains("is-visible")) {
          panel.querySelectorAll("video, audio").forEach((m) => {
            try { m.pause(); } catch { }
          });
        }
      });
    };

    const activate = (key) => {
      tabs.forEach((btn) => {
        const active = btn.getAttribute("data-persona-tab") === key;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });

      panels.forEach((panel) => {
        const show = panel.getAttribute("data-persona-panel") === key;
        panel.classList.toggle("is-visible", show);
      });

      pauseHiddenPanelMedia();
    };

    tabs.forEach((btn) => btn.addEventListener("click", () => activate(btn.getAttribute("data-persona-tab"))));

    const initialKey = root.querySelector("[data-persona-tab].is-active")?.getAttribute("data-persona-tab") || "video";
    activate(initialKey);
  });
};

/* ============================================================
   11) Plyr Players (optional)
============================================================ */

const initPlyrPlayers = () => {
  if (!window.Plyr) return;

  document.querySelectorAll(".js-plyr").forEach((el) => {
    const inst = new window.Plyr(el, {
      controls: ["play", "progress", "current-time", "mute", "volume", "settings"],
    });
    try { el._player = inst; } catch { }
  });
};

/* ============================================================
   12) Audio Library (GLOBAL initializer)  ✅ FIXED SCOPE
============================================================ */

const initAudioLibrary = () => {
  const list = document.querySelector("[data-audio-list]");
  const playerAudio = document.querySelector("[data-player-audio]");
  if (!list || !playerAudio) return;

  const formatTime = (s) => {
    if (!isFinite(s) || s < 0) return "--:--";
    const mm = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${mm}:${String(ss).padStart(2, "0")}`;
  };

  const formatPlays = (n) => {
    const v = Number(n);
    if (!isFinite(v) || v <= 0) return "—";
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return String(v);
  };

  const getPlyrInstance = (audioEl) => audioEl?.plyr || audioEl?._player || null;

  const playerSource = playerAudio.querySelector("source") || (() => {
    const s = document.createElement("source");
    playerAudio.appendChild(s);
    return s;
  })();

  const rows = Array.from(list.querySelectorAll("[data-audio-item]"));
  if (!rows.length) return;

  let currentRow = null;
  let rafId = null;

  const els = {
    title: document.querySelector("[data-player-title]"),
    desc: document.querySelector("[data-player-desc]"),
    meta: document.querySelector("[data-player-meta]"),
    plays: document.querySelector("[data-player-plays]"),
    category: document.querySelector("[data-player-category]"),
    cover: document.querySelector("[data-player-cover]"),
    duration: document.querySelector("[data-player-duration]"),
  };

  const setRowTimeToDuration = (row) => {
    const timeEl = row?.querySelector("[data-duration]");
    if (timeEl) timeEl.textContent = formatTime(row._duration);
  };

  const setRowTimeToCurrent = (row) => {
    const timeEl = row?.querySelector("[data-duration]");
    if (timeEl) timeEl.textContent = formatTime(playerAudio.currentTime);
  };

  const setRowActive = (row) => rows.forEach((r) => r.classList.toggle("is-active", r === row));

  const updateRowPlayIcons = (isPlaying) => {
    rows.forEach((r) => {
      const btn = r.querySelector("[data-audio-play]");
      if (!btn) return;

      const icon = btn.querySelector("i");
      const isCurrent = r === currentRow;

      btn.setAttribute("aria-label", isCurrent && isPlaying ? "إيقاف" : "تشغيل");
      if (icon) {
        icon.classList.toggle("fa-play", !(isCurrent && isPlaying));
        icon.classList.toggle("fa-pause", isCurrent && isPlaying);
      }
    });
  };

  const updateThumbOverlayIcons = (isPlaying) => {
    rows.forEach((r) => {
      const overlayIcon = r.querySelector(".c-audio-row__playIcon i");
      if (!overlayIcon) return;
      const isCurrent = r === currentRow;
      overlayIcon.classList.toggle("fa-play", !(isCurrent && isPlaying));
      overlayIcon.classList.toggle("fa-pause", isCurrent && isPlaying);
    });
  };

  const stopActiveTicker = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  const startActiveTicker = () => {
    stopActiveTicker();
    const tick = () => {
      if (currentRow && !playerAudio.paused && !playerAudio.ended) {
        setRowTimeToCurrent(currentRow);
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };
    rafId = requestAnimationFrame(tick);
  };

  const updatePlayerUIFromRow = (row) => {
    const title = row.dataset.title || "";
    const desc = row.dataset.desc || "";
    const year = row.dataset.year || "";
    const source = row.dataset.source || "";
    const plays = row.dataset.plays || "";
    const categoryLabel = row.dataset.categoryLabel || row.dataset.category || "—";
    const cover = row.dataset.cover || "";

    if (els.title) els.title.textContent = title || "—";
    if (els.desc) els.desc.textContent = desc || "";
    if (els.meta) els.meta.textContent = `${year}${source ? " · " + source : ""}` || "—";
    if (els.plays) els.plays.textContent = formatPlays(plays);
    if (els.category) els.category.textContent = categoryLabel;
    if (els.cover && cover) { els.cover.src = cover; els.cover.alt = title || "غلاف المقطع"; }
  };

  const loadAndPlayRow = async (row) => {
    const url = row.dataset.audio;
    if (!url) return;

    if (currentRow === row) {
      const plyr = getPlyrInstance(playerAudio);
      if (!playerAudio.paused && !playerAudio.ended) {
        if (plyr?.pause) plyr.pause();
        else playerAudio.pause();
        return;
      }
      if (plyr?.play) { try { await plyr.play(); } catch { } }
      else { try { await playerAudio.play(); } catch { } }
      return;
    }

    if (currentRow) setRowTimeToDuration(currentRow);

    currentRow = row;
    setRowActive(row);
    updatePlayerUIFromRow(row);

    playerSource.src = url;
    try { playerAudio.load(); } catch { }

    const plyr = getPlyrInstance(playerAudio);
    if (plyr?.play) { try { await plyr.play(); } catch { } }
    else { try { await playerAudio.play(); } catch { } }
  };

  const ensurePlayButton = (row) => {
    row.querySelectorAll('[aria-label="تفاصيل"], [aria-label="ربط بالمحطة"]').forEach((b) => b.remove());

    const actions = row.querySelector(".c-audio-row__actions");
    if (!actions) return;

    if (!row.querySelector("[data-audio-play]")) {
      const playBtn = document.createElement("button");
      playBtn.className = "c-icon-btn";
      playBtn.type = "button";
      playBtn.setAttribute("aria-label", "تشغيل");
      playBtn.setAttribute("data-audio-play", "");
      playBtn.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';

      const copyBtn = actions.querySelector('[aria-label="نسخ رابط"], [data-audio-copy]');
      if (copyBtn) actions.insertBefore(playBtn, copyBtn);
      else actions.appendChild(playBtn);
    }
  };

  const wireRow = (row) => {
    ensurePlayButton(row);

    const playBtn = row.querySelector("[data-audio-play]");
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadAndPlayRow(row);
      });
    }

    row.addEventListener("click", (e) => {
      const isInteractive = e.target.closest("button, a, input, select, textarea, label");
      if (isInteractive) return;
      loadAndPlayRow(row);
    });

    row.addEventListener("keydown", (e) => {
      if (!ACTIVATION_KEYS.includes(e.key)) return;
      e.preventDefault();
      loadAndPlayRow(row);
    });

    const audioUrl = row.dataset.audio;
    if (audioUrl) {
      const probe = new Audio();
      probe.preload = "metadata";
      probe.src = audioUrl;
      probe.addEventListener("loadedmetadata", () => {
        row._duration = probe.duration;
        if (row !== currentRow) setRowTimeToDuration(row);
      });
    }
  };

  rows.forEach(wireRow);

  playerAudio.addEventListener("loadedmetadata", () => {
    if (els.duration) els.duration.textContent = formatTime(playerAudio.duration);
    if (currentRow) currentRow._duration = playerAudio.duration;
  });

  playerAudio.addEventListener("play", () => {
    updateRowPlayIcons(true);
    updateThumbOverlayIcons(true);
    startActiveTicker();
  });

  playerAudio.addEventListener("pause", () => {
    updateRowPlayIcons(false);
    updateThumbOverlayIcons(false);
    stopActiveTicker();
    if (currentRow) setRowTimeToDuration(currentRow);
  });

  playerAudio.addEventListener("ended", () => {
    updateRowPlayIcons(false);
    updateThumbOverlayIcons(false);
    stopActiveTicker();
    if (currentRow) setRowTimeToDuration(currentRow);
  });
};

/* ============================================================
   13) Hero Stats Counter
============================================================ */

const initHeroStatsCounter = () => {
  const root = document.querySelector("[data-stats]");
  if (!root) return;

  const counters = Array.from(root.querySelectorAll(".c-counter[data-count-to]"));
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el, { duration = 900 } = {}) => {
    const to = Number(el.getAttribute("data-count-to") || 0);
    const prefix = el.getAttribute("data-prefix") || "";
    const suffix = el.getAttribute("data-suffix") || "";

    if (prefersReducedMotion) {
      el.textContent = `${prefix}${to}${suffix}`;
      return;
    }

    const from = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);

      const value = Math.round(from + (to - from) * eased);
      el.textContent = `${prefix}${value}${suffix}`;

      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = `${prefix}${to}${suffix}`;
    };

    requestAnimationFrame(tick);
  };

  const runAll = () => counters.forEach((el, idx) => setTimeout(() => animateCounter(el, { duration: 900 }), idx * 120));

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runAll();
        obs.disconnect();
      });
    },
    { threshold: 0.35 }
  );

  obs.observe(root);
};

/* ============================================================
   14) Quotes Spotlight (AUTO IIFE, no global call)
============================================================ */

(function () {
  "use strict";

  function initQuotesSpotlight(root) {
    if (!root) return;

    const featured = root.querySelector("[data-q-featured]");
    const listRoot = root.querySelector("[data-q-list]");
    if (!featured || !listRoot) return;

    const tKicker = featured.querySelector("[data-q-kicker]");
    const tChip = featured.querySelector("[data-q-chip]");
    const tText = featured.querySelector("[data-q-text]");
    const tWho = featured.querySelector("[data-q-who]");
    const tMeta = featured.querySelector("[data-q-meta]");
    const tSourceText = featured.querySelector("[data-q-source-text]");

    const btnCopy = featured.querySelector("[data-q-copy]");
    const btnShare = featured.querySelector("[data-q-share]");

    const searchInput = root.querySelector("[data-q-search]");
    const btnPrev = root.querySelector("[data-q-prev]");
    const btnNext = root.querySelector("[data-q-next]");
    const emptyState = root.querySelector("[data-q-empty]");

    const items = Array.from(listRoot.querySelectorAll("[data-q-item]"));
    if (!items.length) return;

    const norm = (s) => String(s || "").trim().toLowerCase();
    const getVisibleItems = () => items.filter((el) => !el.classList.contains("u-hide"));

    const setActiveItem = (active) => items.forEach((el) => el.classList.toggle("is-active", el === active));

    const buildChip = (typeLabel, typeIcon) => {
      const icon = typeIcon || "fa-regular fa-newspaper";
      const label = typeLabel || "";
      return `<i class="${icon}" aria-hidden="true"></i>${label ? " " + label : ""}`;
    };

    const renderFeatured = (item) => {
      if (!item) return;
      const d = item.dataset;

      const title = d.qTitle || "اقتباس موثق";
      const typeLabel = d.qTypeLabel || "";
      const typeIcon = d.qTypeIcon || "fa-regular fa-newspaper";

      const text = d.qText || "";
      const meta = d.qMeta || "";
      const source = d.qSource || "مصدر عند توفره";
      const who = d.qWho || "صالح العاروري";

      if (tKicker) tKicker.textContent = title;
      if (tChip) tChip.innerHTML = buildChip(typeLabel, typeIcon);
      if (tText) tText.textContent = text;
      if (tWho) tWho.textContent = who;
      if (tMeta) tMeta.textContent = meta;
      if (tSourceText) tSourceText.textContent = source;

      featured.dataset.qActiveText = text;
      featured.dataset.qActiveMeta = meta;
      featured.dataset.qActiveSource = source;

      setActiveItem(item);
    };

    const getActiveItem = () => {
      const visible = getVisibleItems();
      if (!visible.length) return null;
      return visible.find((el) => el.classList.contains("is-active")) || visible[0];
    };

    const step = (dir) => {
      const visible = getVisibleItems();
      if (!visible.length) return;

      const active = getActiveItem();
      const i = Math.max(0, visible.indexOf(active));
      const nextIndex = dir === "next"
        ? Math.min(visible.length - 1, i + 1)
        : Math.max(0, i - 1);

      const nextItem = visible[nextIndex];
      renderFeatured(nextItem);
      nextItem.focus?.();
    };

    const applySearch = (q) => {
      const query = norm(q);
      let shown = 0;

      items.forEach((item) => {
        const d = item.dataset;
        const haystack = [d.qText, d.qYear, d.qTypeLabel, d.qMeta, d.qSource, d.qId].map(norm).join(" ");
        const match = !query || haystack.includes(query);

        item.classList.toggle("u-hide", !match);
        if (match) shown += 1;
      });

      if (emptyState) emptyState.classList.toggle("u-hide", shown !== 0);

      const active = getActiveItem();
      if (active) renderFeatured(active);
    };

    const copyFeatured = async () => {
      const text = featured.dataset.qActiveText || tText?.textContent || "";
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        btnCopy?.classList.add("is-done");
        setTimeout(() => btnCopy?.classList.remove("is-done"), 700);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch { }
        document.body.removeChild(ta);
      }
    };

    const shareFeatured = async () => {
      const text = featured.dataset.qActiveText || tText?.textContent || "";
      const meta = featured.dataset.qActiveMeta || tMeta?.textContent || "";
      const payload = meta ? `${text}\n\n— ${meta}` : text;
      if (!payload) return;

      if (navigator.share) {
        try { await navigator.share({ title: "اقتباس", text: payload }); return; } catch { }
      }
      try { await navigator.clipboard.writeText(payload); } catch { }
    };

    listRoot.addEventListener("click", (e) => {
      const item = e.target.closest("[data-q-item]");
      if (!item || !listRoot.contains(item)) return;
      renderFeatured(item);
    });

    listRoot.addEventListener("keydown", (e) => {
      if (!["Enter", " "].includes(e.key)) return;
      const item = e.target.closest("[data-q-item]");
      if (!item || !listRoot.contains(item)) return;
      e.preventDefault();
      renderFeatured(item);
    });

    if (searchInput) searchInput.addEventListener("input", (e) => applySearch(e.target.value));
    if (btnPrev) btnPrev.addEventListener("click", () => step("prev"));
    if (btnNext) btnNext.addEventListener("click", () => step("next"));
    if (btnCopy) btnCopy.addEventListener("click", copyFeatured);
    if (btnShare) btnShare.addEventListener("click", shareFeatured);

    const initial = items.find((el) => el.classList.contains("is-active")) || items[0];
    renderFeatured(initial);
  }

  function bootQuotes() {
    document.querySelectorAll(".c-quotes").forEach((section) => initQuotesSpotlight(section));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootQuotes);
  else bootQuotes();
})();

/* ============================================================
   15) REELS — Dedicated Modal Feed (FIXED + Delegated)
============================================================ */

const initReelsModal = () => {
  const modalEl = document.getElementById("reelsModal");
  if (!modalEl || !window.bootstrap?.Modal) return;

  const viewport = modalEl.querySelector("[data-reels-viewport]");
  const track = modalEl.querySelector("[data-reels-track]");
  const dotsEl = modalEl.querySelector("[data-reels-dots]");
  const btnPrev = modalEl.querySelector("[data-reels-prev]");
  const btnNext = modalEl.querySelector("[data-reels-next]");

  const sideTitle = modalEl.querySelector("[data-reel-side-title]");
  const sideMeta = modalEl.querySelector("[data-reel-side-meta]");
  const sideDuration = modalEl.querySelector("[data-reel-side-duration]");
  const sideDate = modalEl.querySelector("[data-reel-side-date]");
  const sideSource = modalEl.querySelector("[data-reel-side-source]");

  if (!viewport || !track) return;

  const bsModal = window.bootstrap.Modal.getOrCreateInstance(modalEl);

  const getReelCards = () => Array.from(document.querySelectorAll("[data-reel-card]"));

  const getReelDataFromCard = (el) => ({
    id: el?.dataset?.reelId || "",
    title: el?.dataset?.reelTitle || "ريل",
    meta: el?.dataset?.reelMeta || "",
    source: el?.dataset?.reelSource || "",
    date: el?.dataset?.reelDate || "",
    duration: el?.dataset?.reelDuration || "",
    poster: el?.dataset?.reelPoster || "",
    video: el?.dataset?.reelVideo || "",
  });

  const formatDate = (iso) => (iso ? String(iso).replaceAll("-", "/") : "—");

  const state = {
    dataList: [],
    activeIndex: 0,
    isBuilt: false,
    allowScrollSync: true,
  };

  const updateSide = (d) => {
    if (sideTitle) sideTitle.textContent = d?.title || "—";
    if (sideMeta) sideMeta.textContent = d?.meta || "—";
    if (sideDuration) sideDuration.textContent = d?.duration || "—";
    if (sideDate) sideDate.textContent = formatDate(d?.date || "");
    if (sideSource) sideSource.textContent = d?.source || "—";
  };

  const pauseAllExcept = (index) => {
    const slides = Array.from(track.querySelectorAll("[data-reels-slide]"));
    slides.forEach((slide, idx) => {
      const v = slide.querySelector("video");
      if (!v) return;
      if (idx === index) return;
      try { v.pause(); } catch { }
    });
  };

  const playAt = (index) => {
    const slides = Array.from(track.querySelectorAll("[data-reels-slide]"));
    const slide = slides[index];
    if (!slide) return;

    const v = slide.querySelector("video");
    if (!v) return;

    // Autoplay policies: keep muted by default
    v.muted = true;

    // Use RAF after modal layout to reduce "play failed" cases
    requestAnimationFrame(() => {
      const p = v.play();
      if (p?.catch) p.catch(() => { /* blocked -> user can press play */ });
    });
  };

  const syncDots = (index) => {
    if (!dotsEl) return;
    const dots = Array.from(dotsEl.querySelectorAll(".c-reels-dot"));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  };

  const setActive = (index) => {
    const clamped = Math.max(0, Math.min(index, state.dataList.length - 1));
    state.activeIndex = clamped;

    updateSide(state.dataList[clamped]);
    pauseAllExcept(clamped);
    syncDots(clamped);
    playAt(clamped);
  };

  const buildSlides = (activeId) => {
    const reelCards = getReelCards();
    if (!reelCards.length) return false;

    track.innerHTML = "";
    if (dotsEl) dotsEl.innerHTML = "";

    state.dataList = reelCards.map(getReelDataFromCard);

    state.dataList.forEach((d, idx) => {
      const slide = document.createElement("article");
      slide.className = "c-reels-slide";
      slide.setAttribute("data-reels-slide", "");
      slide.setAttribute("data-reels-id", d.id || `reel-${idx}`);
      slide.setAttribute("aria-label", d.title);

      const video = document.createElement("video");
      video.className = "c-reels-slide__video";
      video.src = d.video;
      if (d.poster) video.poster = d.poster;
      video.preload = "metadata";
      video.playsInline = true;
      video.muted = true;
      video.loop = true;

      const shade = document.createElement("div");
      shade.className = "c-reels-slide__shade";
      shade.setAttribute("aria-hidden", "true");

      const info = document.createElement("div");
      info.className = "c-reels-slide__info";
      info.innerHTML = `
        <h3 class="c-reels-slide__title">${d.title}</h3>
        <p class="c-reels-slide__meta">${d.meta || ""}</p>
      `;

      const actions = document.createElement("div");
      actions.className = "c-reels-slide__actions";
      actions.innerHTML = `
        <button class="c-reels-action" type="button" aria-label="تشغيل/إيقاف" data-reels-toggle>
          <i class="fa-solid fa-pause" aria-hidden="true"></i>
        </button>
        <button class="c-reels-action" type="button" aria-label="كتم/إلغاء كتم" data-reels-mute>
          <i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>
        </button>
      `;

      slide.appendChild(video);
      slide.appendChild(shade);
      slide.appendChild(info);
      slide.appendChild(actions);

      track.appendChild(slide);

      if (dotsEl) {
        const dot = document.createElement("span");
        dot.className = "c-reels-dot";
        dot.setAttribute("aria-hidden", "true");
        dotsEl.appendChild(dot);
      }
    });

    const found = state.dataList.findIndex((x) => x.id === activeId);
    state.activeIndex = Math.max(0, found);

    return true;
  };

  const goToIndex = (index) => {
    const slides = Array.from(track.querySelectorAll("[data-reels-slide]"));
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    const target = slides[clamped];
    if (!target) return;

    state.allowScrollSync = false;
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    // Allow scroll sync after the smooth scroll settles
    window.setTimeout(() => { state.allowScrollSync = true; }, 220);

    setActive(clamped);
  };

  const calcActiveIndex = () => {
    const h = viewport.clientHeight || 1;
    return Math.max(0, Math.min(Math.round(viewport.scrollTop / h), state.dataList.length - 1));
  };

  // Slide actions (play/pause, mute) via delegation
  track.addEventListener("click", (e) => {
    const slide = e.target.closest("[data-reels-slide]");
    if (!slide) return;

    const v = slide.querySelector("video");
    if (!v) return;

    const toggleBtn = e.target.closest("[data-reels-toggle]");
    const muteBtn = e.target.closest("[data-reels-mute]");

    if (toggleBtn) {
      if (v.paused) {
        const p = v.play();
        if (p?.catch) p.catch(() => { });
        toggleBtn.innerHTML = `<i class="fa-solid fa-pause" aria-hidden="true"></i>`;
      } else {
        try { v.pause(); } catch { }
        toggleBtn.innerHTML = `<i class="fa-solid fa-play" aria-hidden="true"></i>`;
      }
    }

    if (muteBtn) {
      v.muted = !v.muted;
      muteBtn.innerHTML = v.muted
        ? `<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>`
        : `<i class="fa-solid fa-volume-high" aria-hidden="true"></i>`;
    }
  });

  // Scroll watcher
  let scrollTimer = null;
  viewport.addEventListener("scroll", () => {
    if (!state.allowScrollSync) return;

    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      const idx = calcActiveIndex();
      if (idx === state.activeIndex) return;
      setActive(idx);
    }, 80);
  }, { passive: true });

  // Keyboard navigation
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); goToIndex(state.activeIndex + 1); }
    if (e.key === "ArrowUp") { e.preventDefault(); goToIndex(state.activeIndex - 1); }
  });

  if (btnPrev) btnPrev.addEventListener("click", () => goToIndex(state.activeIndex - 1));
  if (btnNext) btnNext.addEventListener("click", () => goToIndex(state.activeIndex + 1));

  // Cleanup on close
  modalEl.addEventListener("hidden.bs.modal", () => {
    modalEl.querySelectorAll("video").forEach((v) => { try { v.pause(); } catch { } });
    track.innerHTML = "";
    if (dotsEl) dotsEl.innerHTML = "";
    state.isBuilt = false;
  });

  // Delegated open from any reel card (supports backend-rendered cards)
  const openFromTrigger = (trigger) => {
    const activeId = trigger.dataset.reelId || "";

    // Build fresh each time (safe if backend updates list)
    const ok = buildSlides(activeId);
    if (!ok) return;

    bsModal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      // Force top alignment then activate
      viewport.scrollTop = 0;

      // Go to initial index after modal layout is stable
      requestAnimationFrame(() => {
        goToIndex(state.activeIndex);
        try { viewport.focus(); } catch { }
      });
    }, { once: true });
  };

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-reel-card]");
    if (!trigger) return;
    openFromTrigger(trigger);
  });

  document.addEventListener("keydown", (e) => {
    const trigger = e.target.closest("[data-reel-card][role='button']");
    if (!trigger) return;
    if (!ACTIVATION_KEYS.includes(e.key)) return;
    e.preventDefault();
    openFromTrigger(trigger);
  });
};

/* ============================================================
   16) Main Boot (DOM Ready)
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  bootTheme();

  setActiveNavLink();
  initTabs();
  initHeroCarousel();
  initMediaModals();
  initCollectionNavigation();
  initHeaderScrollState();

  initMilestoneCards();
  initThemeToggle();

  initPersonaFlip();
  initPersonaMediaTabs();
  initPlyrPlayers();

  // ✅ Now it's a real global initializer, no ReferenceError
  initAudioLibrary();

  initHeroStatsCounter();
  initReelsModal();
});

// Expose helper for external triggers
window.modalHelper = modalHelper;
