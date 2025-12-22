/**
 * ------------------------------------------------------------
 * Global UI Initializers (Vanilla JS + Bootstrap + optional OwlCarousel)
 * ------------------------------------------------------------
 * Notes:
 * - Keep functions small, defensive, and dependency-aware.
 * - Avoid hard crashes if optional libs (jQuery/OwlCarousel/Bootstrap) are missing.
 * - Use dataset-driven UI updates to keep HTML as the source of truth.
 */

/**
 * Marks the current navigation link as active based on the current pathname.
 * - Supports direct file routing (e.g., /about.html) and folder routing (e.g., /about/ -> index.html fallback).
 * - Adds `aria-current="page"` for accessibility on the active link.
 */
const setActiveNavLink = () => {
  // Normalize current page name (fallback to index.html for directory roots).
  const path = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".c-nav__link").forEach((link) => {
    // Extract final segment from the link href to compare with current page.
    const href = link.getAttribute("href") || "";
    const target = href.split("/").pop();

    // Exact filename match (simple and predictable for static sites).
    const isMatch = target === path;

    // Toggle UI state + a11y state.
    link.classList.toggle("is-active", isMatch);
    if (isMatch) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
};

/**
 * Initializes tab components under any `[data-tabs-root]` containers.
 * Expected structure:
 * - Tabs:   [data-tabs] .c-tab (each tab must have data-tab-target)
 * - Panels: .c-tab-panel (each panel must have data-tab-panel)
 *
 * Behavior:
 * - Clicking a tab activates its matching panel.
 * - The first tab is activated by default.
 */
const initTabs = () => {
  // Collect tab roots declared explicitly or infer them from [data-tabs] containers
  const roots = new Set();

  // Explicit roots (opt-in)
  document.querySelectorAll("[data-tabs-root]").forEach((r) => roots.add(r));

  // Find any tabs containers and infer a sensible root (wrap, area, or closest ancestor)
  document.querySelectorAll("[data-tabs]").forEach((tabsEl) => {
    const inferred =
      tabsEl.closest("[data-tabs-root]") ||
      tabsEl.closest(".c-bio-tabs__wrap") ||
      tabsEl.closest(".c-tabs-area") ||
      tabsEl.closest(".c-bio-tabs") ||
      tabsEl.closest(".c-tabs") ||
      document.body;
    if (inferred) roots.add(inferred);
  });

  // For each root, wire the tabs found inside it
  roots.forEach((root) => {
    const tabsContainer = root.querySelector("[data-tabs]") || root.querySelector(".c-bio-tabs__tabs") || root.querySelector(".c-tabs");
    if (!tabsContainer) return;

    const tabs = tabsContainer.querySelectorAll(".c-tab");
    const panels = root.querySelectorAll(".c-tab-panel");

    if (!tabs.length || !panels.length) return;

    /**
     * Activates a given tab and shows its corresponding panel.
     * @param {HTMLElement} tab - The tab element to activate.
     */
    const activateTab = (tab) => {
      const target = tab.getAttribute("data-tab-target");

      // Toggle active styling for tabs.
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));

      // Toggle visibility for panels by matching the data attribute.
      panels.forEach((p) =>
        p.classList.toggle("is-visible", p.getAttribute("data-tab-panel") === target)
      );
    };

    // Wire events and set initial active tab.
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => activateTab(tab));
      // Also support keyboard activation for accessibility
      tab.addEventListener("keydown", (e) => {
        if (!["Enter", " ", "Spacebar"].includes(e.key)) return;
        e.preventDefault();
        activateTab(tab);
      });
      if (i === 0) activateTab(tab);
    });
  });
};

/**
 * Initializes the hero carousel if jQuery + OwlCarousel are present.
 * This is optional: if those libraries are not loaded, the page still works.
 */
const initHeroCarousel = () => {
  // Dependency check: OwlCarousel is a jQuery plugin.
  if (window.jQuery && window.jQuery.fn.owlCarousel) {
    const $carousel = window.jQuery(".js-hero-carousel");

    // Only init if we actually have a carousel element.
    if ($carousel.length) {
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
    }
  }
};

/**
 * Small helper wrapper around Bootstrap's modal API.
 * Keeps modal usage centralized and easy to extend later.
 */
const modalHelper = {
  /**
   * Opens a Bootstrap modal by element id.
   * @param {string} id - The modal element id.
   */
  open: (id) => {
    const modalEl = document.getElementById(id);

    // Dependency check: Bootstrap Modal must exist.
    if (modalEl && window.bootstrap?.Modal) {
      const modal = new window.bootstrap.Modal(modalEl);
      modal.show();
    }
  },
};
/**
 * Media Detail Modal
 * - Binds click/keyboard to [data-media-card] triggers
 * - Hydrates the Bootstrap modal fields from data-* attributes
 * - Supports optional video playback (mp4 or embed URL)
 */
const initMediaModals = () => {
  const modalEl = document.getElementById("mediaDetailModal");
  if (!modalEl) return;

  // Bootstrap availability guard
  if (!window.bootstrap?.Modal) return;

  // Cache targets (defensive)
  const titleEl = modalEl.querySelector("[data-modal-title-target]");
  const descriptionEl = modalEl.querySelector("[data-modal-description-target]");
  const badgeEl = modalEl.querySelector("[data-modal-badge-target]");
  const timestampEl = modalEl.querySelector("[data-modal-timestamp-target]");
  const sourceEl = modalEl.querySelector("[data-modal-source-target]");
  const imageEl = modalEl.querySelector("[data-modal-image-target]");

  // Video targets (we will inject a video player)
  const videoMount = modalEl.querySelector("[data-modal-video-mount]");
  const audioMount = modalEl.querySelector("[data-modal-audio-mount]");

  const defaults = {
    title: "أرشيف الوسائط",
    description: "مادة مختارة ضمن توثيق بصري وسمعي.",
    badge: "",
    timestamp: "",
    source: "",
    image: "assets/img/articles/thumb1.png",
  };

  // Create a single Bootstrap modal instance (recommended)
  const bsModal = window.bootstrap.Modal.getOrCreateInstance(modalEl);

  /**
   * Renders video player into the modal.
   * Supports:
   * - MP4: <video controls>
   * - Embed URL: <iframe>
   */
  const renderVideo = (videoUrl, posterUrl) => {
    // No mounts available
    if (!videoMount && !audioMount) return;

    // Clear previous content
    if (videoMount) videoMount.innerHTML = "";
    if (audioMount) audioMount.innerHTML = "";

    // If no media provided: render nothing
    if (!videoUrl) return;

    const isEmbed = /youtube\.com\/embed|player\.vimeo\.com|https?:\/\//i.test(videoUrl) && !/\.mp4(\?|$)/i.test(videoUrl);
    const isAudio = /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(videoUrl);

    if (isAudio) {
      const audio = document.createElement("audio");
      audio.className = "c-modal__audio-player";
      audio.controls = true;
      audio.preload = "metadata";

      const src = document.createElement("source");
      src.src = videoUrl;
      // best-effort mime type
      src.type = "audio/mpeg";
      audio.appendChild(src);

      if (audioMount) audioMount.appendChild(audio);
      else if (videoMount) videoMount.appendChild(audio);
      return;
    }

    if (isEmbed) {
      const iframe = document.createElement("iframe");
      iframe.src = videoUrl;
      iframe.title = "مشغل الفيديو";
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "true");
      iframe.className = "c-modal__video-frame";
      if (videoMount) videoMount.appendChild(iframe);
      return;
    }

    // Default: mp4 file
    const video = document.createElement("video");
    video.className = "c-modal__video-player";
    video.controls = true;
    video.preload = "metadata";
    if (posterUrl) video.poster = posterUrl;

    const source = document.createElement("source");
    source.src = videoUrl;
    source.type = "video/mp4";

    video.appendChild(source);
    if (videoMount) videoMount.appendChild(video);
  };

  /**
   * Updates modal UI from trigger dataset and opens it.
   */
  const updateModal = (dataset) => {
    if (titleEl) titleEl.textContent = dataset.modalTitle || defaults.title;
    if (descriptionEl) descriptionEl.textContent = dataset.modalDescription || defaults.description;
    if (badgeEl) badgeEl.textContent = dataset.modalBadge || defaults.badge;
    if (timestampEl) timestampEl.textContent = dataset.modalTimestamp || defaults.timestamp;
    if (sourceEl) sourceEl.textContent = dataset.modalSource || defaults.source;

    if (imageEl) {
      const img = dataset.modalImage || defaults.image;
      imageEl.src = img;
      imageEl.alt = dataset.modalTitle || defaults.title;
    }

    // Inject video if provided
    renderVideo(dataset.modalVideo, dataset.modalImage);

    // Open modal
    bsModal.show();
  };

  /**
   * Stop any playing media when the modal closes.
   */
  modalEl.addEventListener("hidden.bs.modal", () => {
    if (videoMount) videoMount.innerHTML = "";
    if (audioMount) audioMount.innerHTML = "";
  });

  // Bind triggers
  document.querySelectorAll("[data-media-card]").forEach((trigger) => {
    const handle = (event) => {
      if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
      if (event.type === "keydown") event.preventDefault();
      updateModal(trigger.dataset);
    };

    trigger.addEventListener("click", handle);
    if (trigger.getAttribute("role") === "button") trigger.addEventListener("keydown", handle);
  });
};

/**
 * Enables "clickable cards" navigation inside the collection grid container.
 * Expected:
 * - Container: .c-collection-grid
 * - Click targets: [data-collection-link] with a URL value
 *
 * Also supports keyboard activation (Enter/Space) when focused.
 */
const initCollectionNavigation = () => {
  const container = document.querySelector(".c-collection-grid");
  if (!container) return;

  /**
   * Navigates to a provided URL string.
   * @param {string} link - Destination URL.
   */
  const navigate = (link) => {
    if (!link) return;
    window.location.href = link;
  };

  /**
   * Handles pointer click navigation from a delegated container listener.
   */
  const handleClick = (event) => {
    const card = event.target.closest("[data-collection-link]");
    if (!card) return;

    // Prevent unexpected default behavior (e.g., if nested <a> tags exist).
    event.preventDefault();
    navigate(card.dataset.collectionLink);
  };

  /**
   * Handles keyboard navigation for Enter/Space on focused elements.
   */
  const handleKeydown = (event) => {
    if (!["Enter", " "].includes(event.key)) return;

    const card = event.target.closest("[data-collection-link]");
    if (!card) return;

    event.preventDefault();
    navigate(card.dataset.collectionLink);
  };

  // Delegated events keep listeners minimal and resilient to DOM changes.
  container.addEventListener("click", handleClick);
  container.addEventListener("keydown", handleKeydown);
};

/**
 * Adds a scrolled state class to the header when the page is scrolled.
 * Useful for sticky headers (shadow/background changes).
 */
const initHeaderScrollState = () => {
  const header = document.querySelector(".c-header");
  if (!header) return;

  /**
   * Toggles the header scrolled class based on scroll position.
   */
  const toggleShadow = () => {
    header.classList.toggle("c-header--scrolled", window.scrollY > 10);
  };

  // Passive scroll listener for better scrolling performance.
  window.addEventListener("scroll", toggleShadow, { passive: true });

  // Apply initial state on load.
  toggleShadow();
};
// Theme toggle helpers and preference persistence
const themeStorageKey = "salehThemePreference";
const themePrefersDark = window.matchMedia("(prefers-color-scheme: dark)");

const safeReadTheme = () => {
  try {
    return localStorage.getItem(themeStorageKey);
  } catch {
    return null;
  }
};

const safeWriteTheme = (value) => {
  try {
    if (value) localStorage.setItem(themeStorageKey, value);
    else localStorage.removeItem(themeStorageKey);
  } catch {
    /* ignore storage errors */
  }
};

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

const applyColorTheme = (variant, { persist = false } = {}) => {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  const isDark = variant === "dark";
  if (isDark) {
    root.setAttribute("data-theme", "dark");
    body.classList.add("is-dark");
  } else {
    root.removeAttribute("data-theme");
    body.classList.remove("is-dark");
  }

  updateThemeToggleVisual(isDark);
  if (persist) safeWriteTheme(variant);
};

const handleSystemThemeChange = (event) => {
  if (safeReadTheme()) return;
  const next = event.matches ? "dark" : "light";
  applyColorTheme(next);
};

const initThemeToggle = () => {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    applyColorTheme(next, { persist: true });
  });
};

const storedTheme = safeReadTheme();
const initialTheme = storedTheme || (themePrefersDark.matches ? "dark" : "light");
applyColorTheme(initialTheme);

if (themePrefersDark.addEventListener) {
  themePrefersDark.addEventListener("change", handleSystemThemeChange);
} else if (themePrefersDark.addListener) {
  themePrefersDark.addListener(handleSystemThemeChange);
}
/**
 * Makes collection cards behave like links.
 * Uses data-collection-link attribute.
 */
const initCollectionCards = () => {
  document.querySelectorAll("[data-collection-link]").forEach((card) => {
    const href = card.getAttribute("data-collection-link");
    if (!href) return;

    const go = (e) => {
      if (e.type === "keydown" && !["Enter", " "].includes(e.key)) return;
      if (e.type === "keydown") e.preventDefault();
      window.location.href = href;
    };

    card.addEventListener("click", go);
    card.addEventListener("keydown", go);
  });
};
/**
 * Makes milestone cards open the modal when clicking on the card body,
 * while keeping the button as the primary call-to-action.
 */
const initMilestoneCards = () => {
  document.querySelectorAll(".c-milestone").forEach((card) => {
    const trigger = card.querySelector("[data-media-card]");
    if (!trigger) return;

    const open = (e) => {
      // Ignore clicks on links/buttons inside
      const isInteractive = e.target.closest("button, a, [data-media-card]");
      if (isInteractive) return;
      trigger.click();
    };

    card.addEventListener("click", open);
  });
};
const initPersonaFlip = () => {
  document.querySelectorAll("[data-persona-flip]").forEach((card) => {
    const toFront = () => {
      card.classList.remove("is-flipped");
      card.querySelectorAll("video, audio").forEach((m) => { try { m.pause(); } catch { } });
    };

    const toBack = () => {
      card.classList.add("is-flipped");
    };

    card.querySelectorAll("[data-flip-to]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const target = btn.getAttribute("data-flip-to");
        if (target === "back") toBack();
        else toFront();
      });
    });

    // Allow clicking the card (outside interactive controls) to toggle flip
    const toggleFlip = () => {
      card.classList.toggle("is-flipped");
      if (!card.classList.contains("is-flipped")) {
        // When returning to front, pause any media inside
        card.querySelectorAll("video, audio").forEach((m) => { try { m.pause(); } catch { } });
      }
    };

    card.addEventListener("click", (e) => {
      // Ignore clicks on interactive child elements (buttons, links, media controls, tabs)
      const isInteractive = e.target.closest("button, a, [data-flip-to], [data-persona-media], .js-plyr, video, audio");
      if (isInteractive) return;
      toggleFlip();
    });

    // Keyboard activation when the card itself is focused (Enter / Space)
    card.addEventListener("keydown", (e) => {
      if (!["Enter", " "].includes(e.key)) return;
      // Only toggle when the card element is the active/focused element
      if (document.activeElement !== card) return;
      e.preventDefault();
      toggleFlip();
    });

    // Click mode only (no hover)
    card.setAttribute("data-flip-mode", "click");
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
  });
};

const initPersonaMediaTabs = () => {
  document.querySelectorAll("[data-persona-media]").forEach((root) => {
    const tabs = root.querySelectorAll("[data-persona-tab]");
    const panels = root.closest(".c-persona__back")?.querySelectorAll("[data-persona-panel]") || root.parentElement.querySelectorAll("[data-persona-panel]");
    if (!tabs.length || !panels.length) return;

    const activate = (key) => {
      tabs.forEach((btn) => {
        const active = btn.getAttribute("data-persona-tab") === key;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });

      panels.forEach((panel) => {
        const show = panel.getAttribute("data-persona-panel") === key;
        panel.classList.toggle("is-visible", show);
        if (!show) panel.querySelectorAll("video, audio").forEach((m) => { try { m.pause(); } catch { } });
      });
    };

    tabs.forEach((btn) => btn.addEventListener("click", () => activate(btn.getAttribute("data-persona-tab"))));
    activate(root.querySelector("[data-persona-tab].is-active")?.getAttribute("data-persona-tab") || "video");
  });
};

const initPlyrPlayers = () => {
  if (!window.Plyr) return;
  document.querySelectorAll(".js-plyr").forEach((el) => {
    // eslint-disable-next-line no-new
    new window.Plyr(el, {
      controls: ["play", "progress", "current-time", "mute", "volume", "settings"],
    });
  });
};

/* =========================================
  Hero Stats Counter
  - Runs once when stats enter viewport
  - Smooth easing
  - Supports prefix/suffix
========================================= */

const initHeroStatsCounter = () => {
  const root = document.querySelector("[data-stats]");
  if (!root) return;

  const counters = root.querySelectorAll(".c-counter[data-count-to]");
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el, { duration = 900 } = {}) => {
    const to = Number(el.getAttribute("data-count-to") || 0);
    const prefix = el.getAttribute("data-prefix") || "";
    const suffix = el.getAttribute("data-suffix") || "";

    if (prefersReducedMotion) {
      el.textContent = `${prefix}${to}${suffix}`;
      return;
    }

    const start = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);

      const value = Math.round(start + (to - start) * eased);
      el.textContent = `${prefix}${value}${suffix}`;

      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = `${prefix}${to}${suffix}`;
    };

    requestAnimationFrame(tick);
  };

  const run = () => {
    counters.forEach((el, idx) => {
      // Small stagger for premium feel
      setTimeout(() => animateCounter(el, { duration: 900 }), idx * 120);
    });
  };

  // Run once on enter viewport
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run();
        obs.disconnect();
      });
    },
    { threshold: 0.35 }
  );

  obs.observe(root);
};
/* =========================================
  AUDIO LIBRARY — JS
  - Plyr init
  - Click row to play
  - Filter/search/sort
  - Update player card
  - Compute durations when metadata available
========================================= */

(function () {
  const listRoot = document.querySelector("[data-audio-list]");
  const empty = document.querySelector("[data-audio-empty]");
  const search = document.querySelector("[data-audio-search]");
  const sort = document.querySelector("[data-audio-sort]");
  const filtersRoot = document.querySelector("[data-audio-filters]");

  const playerAudio = document.querySelector("[data-player-audio]");
  const playerTitle = document.querySelector("[data-player-title]");
  const playerDesc = document.querySelector("[data-player-desc]");
  const playerMeta = document.querySelector("[data-player-meta]");
  const playerCover = document.querySelector("[data-player-cover]");
  const playerBadge = document.querySelector("[data-player-badge]");
  const playerDuration = document.querySelector("[data-player-duration]");
  const playerPlays = document.querySelector("[data-player-plays]");
  const playerCategory = document.querySelector("[data-player-category]");

  if (!listRoot || !playerAudio) return;

  const items = Array.from(listRoot.querySelectorAll("[data-audio-item]"));

  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const formatPlays = (n) => {
    const num = Number(n || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return `${num}`;
  };

  const formatTime = (seconds) => {
    if (!isFinite(seconds)) return "--:--";
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  // Plyr
  let plyr = null;
  try {
    plyr = new Plyr(playerAudio, {
      controls: ["play", "progress", "current-time", "duration", "mute", "volume"],
      i18n: { play: "تشغيل", pause: "إيقاف", mute: "كتم", unmute: "إلغاء الكتم" }
    });
  } catch {
    // fallback native
  }

  const setActiveRow = (row) => {
    items.forEach((it) => it.classList.remove("is-active"));
    row.classList.add("is-active");
  };

  const updatePlayer = (row) => {
    const title = row.getAttribute("data-title") || "—";
    const desc = row.getAttribute("data-desc") || "";
    const year = row.getAttribute("data-year") || "—";
    const source = row.getAttribute("data-source") || "مصدر عند توفره";
    const catLabel = row.getAttribute("data-category-label") || "—";
    const plays = row.getAttribute("data-plays") || "0";
    const cover = row.getAttribute("data-cover") || "";
    const audio = row.getAttribute("data-audio") || "";

    if (playerTitle) playerTitle.textContent = title;
    if (playerDesc) playerDesc.textContent = desc || "—";
    if (playerMeta) playerMeta.textContent = `${year} · ${source}`;
    if (playerCover && cover) playerCover.src = cover;
    if (playerBadge) playerBadge.textContent = "قيد التشغيل";
    if (playerPlays) playerPlays.textContent = formatPlays(plays);
    if (playerCategory) playerCategory.textContent = catLabel;

    // swap audio source
    if (audio) {
      const current = playerAudio.querySelector("source");
      if (current) current.src = audio;
      playerAudio.load();

      // Auto-play for better UX (optional)
      // Comment this line if you don't want autoplay:
      try { plyr ? plyr.play() : playerAudio.play(); } catch { }
    }
  };

  // Durations (try to read metadata per item)
  const hydrateDurations = () => {
    items.forEach((row) => {
      const audioSrc = row.getAttribute("data-audio");
      const durEl = row.querySelector("[data-duration]");
      const playsEl = row.querySelector("[data-plays-text]");
      const plays = row.getAttribute("data-plays");

      if (playsEl && plays) playsEl.textContent = formatPlays(plays);

      if (!audioSrc || !durEl) return;

      // If you have CORS/Local files, this will work.
      const a = new Audio();
      a.preload = "metadata";
      a.src = audioSrc;

      a.addEventListener("loadedmetadata", () => {
        durEl.textContent = formatTime(a.duration);
        // For sorting by duration
        row.setAttribute("data-duration-seconds", String(Math.round(a.duration || 0)));
      });

      a.addEventListener("error", () => {
        // keep default
        row.setAttribute("data-duration-seconds", "0");
      });
    });
  };

  // Click handlers
  items.forEach((row) => {
    row.addEventListener("click", (e) => {
      // avoid triggering when clicking on action buttons
      const isAction = e.target.closest(".c-icon-btn");
      if (isAction) return;

      setActiveRow(row);
      updatePlayer(row);
    });

    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActiveRow(row);
        updatePlayer(row);
      }
    });
  });

  // Default load first item into player
  const first = items[0];
  if (first) updatePlayer(first);

  // Filter/Search/Sort
  let activeFilter = "all";
  let query = "";
  let sortMode = "recent";

  const getSearchText = (row) => {
    const t = row.getAttribute("data-title") || "";
    const d = row.getAttribute("data-desc") || "";
    const y = row.getAttribute("data-year") || "";
    return normalize([t, d, y].join(" "));
  };

  const apply = () => {
    const visible = [];

    items.forEach((row) => {
      const cat = row.getAttribute("data-category") || "";
      const okType = activeFilter === "all" || cat === activeFilter;
      const okSearch = !query || getSearchText(row).includes(query);

      const show = okType && okSearch;
      row.classList.toggle("u-hide", !show);
      if (show) visible.push(row);
    });

    // Sort visible (by re-append)
    const sorted = visible.sort((a, b) => {
      const aTitle = normalize(a.getAttribute("data-title"));
      const bTitle = normalize(b.getAttribute("data-title"));
      const aDate = a.getAttribute("data-date") || "1900-01-01";
      const bDate = b.getAttribute("data-date") || "1900-01-01";
      const aPlays = Number(a.getAttribute("data-plays") || 0);
      const bPlays = Number(b.getAttribute("data-plays") || 0);
      const aDur = Number(a.getAttribute("data-duration-seconds") || 0);
      const bDur = Number(b.getAttribute("data-duration-seconds") || 0);

      if (sortMode === "title") return aTitle.localeCompare(bTitle, "ar");
      if (sortMode === "popular") return bPlays - aPlays;
      if (sortMode === "duration") return bDur - aDur;
      return bDate.localeCompare(aDate); // recent
    });

    sorted.forEach((row) => listRoot.appendChild(row));

    if (empty) empty.classList.toggle("u-hide", sorted.length !== 0);

    // if active row hidden, activate first visible
    const active = listRoot.querySelector(".c-audio-row.is-active:not(.u-hide)");
    if (!active) {
      const firstVisible = listRoot.querySelector("[data-audio-item]:not(.u-hide)");
      if (firstVisible) {
        setActiveRow(firstVisible);
        updatePlayer(firstVisible);
      }
    }
  };

  // Filter chips
  if (filtersRoot) {
    filtersRoot.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        filtersRoot.querySelectorAll(".c-chip").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        activeFilter = btn.getAttribute("data-filter") || "all";
        apply();
      });
    });
  }

  // Search
  if (search) {
    search.addEventListener("input", () => {
      query = normalize(search.value);
      apply();
    });
  }

  // Sort
  if (sort) {
    sort.addEventListener("change", () => {
      sortMode = sort.value || "recent";
      apply();
    });
  }

  hydrateDurations();
  apply();
})();


/* =========================================================
  QUOTES — Premium Spotlight Controller
  - Featured sync
  - Filter + Search
  - Next / Prev
  - Copy / Share
  - Modal details
========================================================= */

(function () {
  const listRoot = document.querySelector("[data-q-list]");
  if (!listRoot) return;

  const itemsAll = Array.from(listRoot.querySelectorAll("[data-q-item]"));
  const empty = document.querySelector("[data-q-empty]");
  const search = document.querySelector("[data-q-search]");
  const filtersRoot = document.querySelector("[data-q-filters]");
  const btnPrev = document.querySelector("[data-q-prev]");
  const btnNext = document.querySelector("[data-q-next]");

  // Featured targets
  const featured = document.querySelector("[data-q-featured]");
  const fKicker = document.querySelector("[data-q-kicker]");
  const fChip = document.querySelector("[data-q-chip]");
  const fText = document.querySelector("[data-q-text]");
  const fWho = document.querySelector("[data-q-who]");
  const fMeta = document.querySelector("[data-q-meta]");
  const fSourceText = document.querySelector("[data-q-source-text]");
  const btnCopy = document.querySelector("[data-q-copy]");
  const btnShare = document.querySelector("[data-q-share]");
  const btnOpenModal = document.querySelector("[data-q-open-modal]");

  // Modal targets
  const mChip = document.querySelector("[data-qm-chip]");
  const mTitle = document.querySelector("[data-qm-title]");
  const mText = document.querySelector("[data-qm-text]");
  const mMeta = document.querySelector("[data-qm-meta]");
  const mSource = document.querySelector("[data-qm-source]");
  const mCopy = document.querySelector("[data-qm-copy]");
  const mShare = document.querySelector("[data-qm-share]");

  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const state = {
    filter: "all",
    query: "",
    activeId: itemsAll[0]?.getAttribute("data-q-id") || "",
  };

  const getItemData = (el) => ({
    id: el.getAttribute("data-q-id") || "",
    type: el.getAttribute("data-q-type") || "press",
    typeLabel: el.getAttribute("data-q-type-label") || "تصريح",
    typeIcon: el.getAttribute("data-q-type-icon") || "fa-regular fa-newspaper",
    year: el.getAttribute("data-q-year") || "",
    date: el.getAttribute("data-q-date") || "1900-01-01",
    title: el.getAttribute("data-q-title") || "اقتباس موثق",
    text: el.getAttribute("data-q-text") || "",
    meta: el.getAttribute("data-q-meta") || "",
    source: el.getAttribute("data-q-source") || "مصدر عند توفره",
    who: "صالح العاروري",
  });

  const setActive = (id) => {
    state.activeId = id;
    itemsAll.forEach((it) => it.classList.toggle("is-active", it.getAttribute("data-q-id") === id));
  };

  const getVisibleItems = () => itemsAll.filter((it) => !it.classList.contains("u-hide"));

  const hydrateFeatured = (el) => {
    const d = getItemData(el);

    if (fKicker) fKicker.textContent = d.title;
    if (fChip) {
      fChip.innerHTML = `<i class="${d.typeIcon}" aria-hidden="true"></i> ${d.typeLabel}`;
    }
    if (fText) fText.textContent = d.text;
    if (fWho) fWho.textContent = d.who;
    if (fMeta) fMeta.textContent = d.meta || d.year;
    if (fSourceText) fSourceText.textContent = d.source;

    // store current for copy/share/modal
    featured?.setAttribute("data-q-current", JSON.stringify(d));
  };

  const apply = () => {
    const visible = [];

    itemsAll.forEach((el) => {
      const d = getItemData(el);

      const okFilter = state.filter === "all" || d.type === state.filter;
      const hay = normalize([d.text, d.meta, d.year, d.typeLabel].join(" "));
      const okSearch = !state.query || hay.includes(state.query);

      const show = okFilter && okSearch;
      el.classList.toggle("u-hide", !show);
      if (show) visible.push(el);
    });

    // keep active on visible, else move to first visible
    const activeEl = itemsAll.find((it) => it.getAttribute("data-q-id") === state.activeId);
    const activeVisible = activeEl && !activeEl.classList.contains("u-hide");

    if (!activeVisible) {
      const first = visible[0];
      if (first) {
        const id = first.getAttribute("data-q-id");
        setActive(id);
        hydrateFeatured(first);
      }
    }

    if (empty) empty.classList.toggle("u-hide", visible.length !== 0);
  };

  const move = (dir) => {
    const visible = getVisibleItems();
    if (!visible.length) return;

    const active = visible.find((it) => it.getAttribute("data-q-id") === state.activeId) || visible[0];
    const idx = Math.max(0, visible.indexOf(active));
    const next = visible[(idx + dir + visible.length) % visible.length];

    const id = next.getAttribute("data-q-id");
    setActive(id);
    hydrateFeatured(next);

    // subtle focus
    next.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const copyText = async (d) => {
    const payload = `“${d.text}”\n— ${d.who}\n${d.meta || ""}`.trim();
    try {
      await navigator.clipboard.writeText(payload);
    } catch { }
  };

  const share = async (d) => {
    const payload = {
      title: "اقتباس",
      text: `“${d.text}” — ${d.who}`,
      url: location.href,
    };

    if (navigator.share) {
      try { await navigator.share(payload); } catch { }
      return;
    }

    // fallback: copy
    await copyText(d);
  };

  const readCurrent = () => {
    try {
      const raw = featured?.getAttribute("data-q-current") || "";
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const openModalSync = () => {
    const d = readCurrent();
    if (!d) return;

    if (mChip) mChip.textContent = `${d.typeLabel} · ${d.year}`;
    if (mTitle) mTitle.textContent = d.title;
    if (mText) mText.textContent = d.text;
    if (mMeta) mMeta.textContent = d.meta || d.year;
    if (mSource) mSource.textContent = d.source;
  };

  // Events: click item -> featured
  itemsAll.forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-q-id");
      setActive(id);
      hydrateFeatured(el);
    });

    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const id = el.getAttribute("data-q-id");
        setActive(id);
        hydrateFeatured(el);
      }
    });
  });

  // Filters
  if (filtersRoot) {
    filtersRoot.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        filtersRoot.querySelectorAll(".c-chip").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.filter = btn.getAttribute("data-filter") || "all";
        apply();
      });
    });
  }

  // Search
  if (search) {
    search.addEventListener("input", () => {
      state.query = normalize(search.value);
      apply();
    });
  }

  // Prev/Next
  btnPrev && btnPrev.addEventListener("click", () => move(-1));
  btnNext && btnNext.addEventListener("click", () => move(1));

  // Copy/Share on featured
  btnCopy && btnCopy.addEventListener("click", async () => {
    const d = readCurrent();
    if (!d) return;
    await copyText(d);
  });

  btnShare && btnShare.addEventListener("click", async () => {
    const d = readCurrent();
    if (!d) return;
    await share(d);
  });

  // Modal open sync
  btnOpenModal && btnOpenModal.addEventListener("click", openModalSync);

  // Modal actions
  mCopy && mCopy.addEventListener("click", async () => {
    const d = readCurrent();
    if (!d) return;
    await copyText(d);
  });

  mShare && mShare.addEventListener("click", async () => {
    const d = readCurrent();
    if (!d) return;
    await share(d);
  });

  // Init with first active
  const first = itemsAll[0];
  if (first) {
    setActive(first.getAttribute("data-q-id"));
    hydrateFeatured(first);
  }
  apply();
})();




/**
 * Main bootstrap on DOM ready.
 * Keeps startup sequence explicit and easy to maintain.
 */
document.addEventListener("DOMContentLoaded", () => {
  setActiveNavLink();
  initTabs();
  initHeroCarousel();
  initMediaModals();
  initCollectionNavigation();
  initHeaderScrollState();
  initCollectionCards();
  initMilestoneCards();
  initThemeToggle();
  initPersonaFlip();
  initPersonaMediaTabs();
  initPlyrPlayers();
  initHeroStatsCounter();

});

// Expose helper for debugging or external triggers (use sparingly in production).
window.modalHelper = modalHelper;
