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
   0) Utilities (small helpers used across features)
============================================================ */

/**
 * Key list used for keyboard activation across "button-like" elements.
 * Spacebar appears as " " in modern browsers.
 */
const ACTIVATION_KEYS = ["Enter", " "];

/**
 * Safe localStorage getter (won't crash in private mode / blocked storage).
 * @param {string} key
 * @returns {string|null}
 */
const safeStorageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Safe localStorage setter / remover.
 * @param {string} key
 * @param {string|null} value
 */
const safeStorageSet = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* ignore storage errors */
  }
};

/**
 * Runs handler for click OR keyboard activation (Enter/Space).
 * @param {Event} event
 * @param {Function} handler
 */
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

/**
 * Marks the current navigation link as active based on current pathname.
 * - Supports direct file routing (e.g., /about.html)
 * - Supports folder routing (e.g., /about/ -> index.html fallback)
 * - Adds `aria-current="page"` on the active link for accessibility
 */
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
   2) Generic Tabs (dataset-driven)
============================================================ */

/**
 * Initializes tab components under any `[data-tabs-root]` containers.
 * Expected structure:
 * - Tabs container: [data-tabs]
 * - Tabs: .c-tab (each must have `data-tab-target="key"`)
 * - Panels: .c-tab-panel (each must have `data-tab-panel="key"`)
 *
 * Behavior:
 * - Clicking/Enter/Space on tab activates matching panel
 * - First tab is activated by default (if none already active)
 */
const initTabs = () => {
  const roots = new Set();

  // Explicit roots (recommended)
  document.querySelectorAll("[data-tabs-root]").forEach((r) => roots.add(r));

  // Infer roots from [data-tabs] containers (fallback for legacy markup)
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

    /**
     * Activates a tab element and shows its corresponding panel.
     * @param {HTMLElement} tabEl
     */
    const activateTab = (tabEl) => {
      const key = tabEl.getAttribute("data-tab-target");
      if (!key) return;

      tabs.forEach((t) => t.classList.toggle("is-active", t === tabEl));

      panels.forEach((p) => {
        const show = p.getAttribute("data-tab-panel") === key;
        p.classList.toggle("is-visible", show);
      });
    };

    // Wire events
    tabs.forEach((tab, idx) => {
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (e) => handleActivation(e, () => activateTab(tab)));

      // Default selection: first tab
      if (idx === 0) activateTab(tab);
    });
  });
};

/* ============================================================
   3) Optional OwlCarousel (Hero)
============================================================ */

/**
 * Initializes the hero carousel if jQuery + OwlCarousel exist.
 * This is optional: if not present, nothing breaks.
 */
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
   4) Bootstrap Modal Helper (tiny wrapper)
============================================================ */

/**
 * Small helper around Bootstrap's Modal API.
 * Keeps modal usage centralized and easy to extend.
 */
const modalHelper = {
  /**
   * Opens a Bootstrap modal by element id.
   * @param {string} id
   */
  open(id) {
    const modalEl = document.getElementById(id);
    if (!modalEl || !window.bootstrap?.Modal) return;

    const modal = new window.bootstrap.Modal(modalEl);
    modal.show();
  },
};

/* ============================================================
   5) Media Detail Modal (hydrates from data-* on cards)
============================================================ */

/**
 * Media Detail Modal
 * - Binds click/keyboard to [data-media-card] triggers
 * - Hydrates modal fields from trigger dataset
 * - Supports optional video playback:
 *   - mp4 -> <video controls>
 *   - embed URL -> <iframe>
 */
const initMediaModals = () => {
  const modalEl = document.getElementById("mediaDetailModal");
  if (!modalEl || !window.bootstrap?.Modal) return;

  // Cache modal targets (defensive: targets may not exist on some pages)
  const titleEl = modalEl.querySelector("[data-modal-title-target]");
  const descEl = modalEl.querySelector("[data-modal-description-target]");
  const badgeEl = modalEl.querySelector("[data-modal-badge-target]");
  const timeEl = modalEl.querySelector("[data-modal-timestamp-target]");
  const sourceEl = modalEl.querySelector("[data-modal-source-target]");
  const imageEl = modalEl.querySelector("[data-modal-image-target]");
  const videoMount = modalEl.querySelector("[data-modal-video-mount]");

  // Reasonable fallbacks
  const defaults = {
    title: "أرشيف الوسائط",
    description: "مادة مختارة ضمن توثيق بصري وسمعي.",
    badge: "",
    timestamp: "",
    source: "",
    image: "assets/img/articles/thumb1.png",
  };

  // Single instance (recommended by Bootstrap)
  const bsModal = window.bootstrap.Modal.getOrCreateInstance(modalEl);

  /**
   * Clears any mounted video content (prevents audio continuing after close).
   */
  const clearVideo = () => {
    if (videoMount) videoMount.innerHTML = "";
  };

  /**
   * Renders a video player into the modal.
   * @param {string} videoUrl
   * @param {string} posterUrl
   */
  const renderVideo = (videoUrl, posterUrl) => {
    if (!videoMount) return;

    clearVideo();
    if (!videoUrl) return;

    const isMp4 = /\.mp4(\?|$)/i.test(videoUrl);
    const isEmbed =
      /youtube\.com\/embed|player\.vimeo\.com|https?:\/\//i.test(videoUrl) && !isMp4;

    if (isEmbed) {
      const iframe = document.createElement("iframe");
      iframe.src = videoUrl;
      iframe.title = "Video player";
      iframe.className = "c-modal__video-frame";
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "true");
      videoMount.appendChild(iframe);
      return;
    }

    // Default: mp4
    const video = document.createElement("video");
    video.className = "c-modal__video-player";
    video.controls = true;
    video.preload = "metadata";
    if (posterUrl) video.poster = posterUrl;

    const source = document.createElement("source");
    source.src = videoUrl;
    source.type = "video/mp4";

    video.appendChild(source);
    videoMount.appendChild(video);
  };

  /**
   * Hydrates modal UI from trigger dataset and opens it.
   * @param {DOMStringMap} dataset
   */
  const updateModal = (dataset) => {
    const title = dataset.modalTitle || defaults.title;

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = dataset.modalDescription || defaults.description;
    if (badgeEl) badgeEl.textContent = dataset.modalBadge || defaults.badge;
    if (timeEl) timeEl.textContent = dataset.modalTimestamp || defaults.timestamp;
    if (sourceEl) sourceEl.textContent = dataset.modalSource || defaults.source;

    if (imageEl) {
      const img = dataset.modalImage || defaults.image;
      imageEl.src = img;
      imageEl.alt = title;
    }

    renderVideo(dataset.modalVideo, dataset.modalImage);
    bsModal.show();
  };

  // Cleanup on close
  modalEl.addEventListener("hidden.bs.modal", clearVideo);

  // Bind triggers
  document.querySelectorAll("[data-media-card]").forEach((trigger) => {
    const openFromTrigger = (event) => {
      handleActivation(event, () => updateModal(trigger.dataset));
    };

    trigger.addEventListener("click", openFromTrigger);

    // Only add keyboard if it behaves like a button
    if (trigger.getAttribute("role") === "button") {
      trigger.addEventListener("keydown", openFromTrigger);
    }
  });
};

/* ============================================================
   6) Collection Navigation (delegated)
============================================================ */

/**
 * Enables "clickable cards" navigation inside .c-collection-grid using event delegation.
 * Expected:
 * - Container: .c-collection-grid
 * - Items: [data-collection-link="url"]
 */
const initCollectionNavigation = () => {
  const container = document.querySelector(".c-collection-grid");
  if (!container) return;

  const navigate = (url) => {
    if (!url) return;
    window.location.href = url;
  };

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
   7) Header Scroll State (sticky UI)
============================================================ */

/**
 * Adds `c-header--scrolled` to .c-header after a small scroll offset.
 * Useful for sticky headers (shadow/background changes).
 */
const initHeaderScrollState = () => {
  const header = document.querySelector(".c-header");
  if (!header) return;

  const update = () => {
    header.classList.toggle("c-header--scrolled", window.scrollY > 10);
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
};

/* ============================================================
   8) Theme Toggle (light/dark + OS preference + persistence)
============================================================ */

const THEME_STORAGE_KEY = "salehThemePreference";
const themePrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)");

/**
 * Updates the theme toggle UI (icon + aria).
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
 * Applies theme to <html> and <body>.
 * @param {"light"|"dark"} variant
 * @param {{persist?: boolean}} options
 */
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
  if (persist) safeStorageSet(THEME_STORAGE_KEY, variant);
};

/**
 * If user didn't explicitly choose a theme, follow OS theme changes.
 * @param {MediaQueryListEvent} event
 */
const handleSystemThemeChange = (event) => {
  if (safeStorageGet(THEME_STORAGE_KEY)) return;
  applyColorTheme(event.matches ? "dark" : "light");
};

/**
 * Initializes theme toggle button.
 */
const initThemeToggle = () => {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    applyColorTheme(next, { persist: true });
  });
};

/**
 * Boot theme early (before user interactions).
 * - Prefer stored theme if exists
 * - Otherwise follow OS preference
 */
const bootTheme = () => {
  const stored = safeStorageGet(THEME_STORAGE_KEY);
  const initial = stored || (themePrefersDark?.matches ? "dark" : "light");

  applyColorTheme(initial);

  // Listen to OS changes (modern + legacy)
  if (themePrefersDark?.addEventListener) {
    themePrefersDark.addEventListener("change", handleSystemThemeChange);
  } else if (themePrefersDark?.addListener) {
    themePrefersDark.addListener(handleSystemThemeChange);
  }
};

/* ============================================================
   9) Collection Cards (direct binding) — OPTIONAL
   Note: if you use initCollectionNavigation (delegated) you may not need this.
============================================================ */

/**
 * Makes elements with [data-collection-link] behave like links.
 * Use this only if you don't have a delegated container approach.
 */
const initCollectionCards = () => {
  document.querySelectorAll("[data-collection-link]").forEach((card) => {
    const href = card.getAttribute("data-collection-link");
    if (!href) return;

    const go = (event) => {
      handleActivation(event, () => {
        window.location.href = href;
      });
    };

    card.addEventListener("click", go);
    card.addEventListener("keydown", go);
  });
};

/* ============================================================
   10) Milestone Cards (click card body -> open inner media trigger)
============================================================ */

/**
 * Makes milestone cards open a nested [data-media-card] trigger on body click.
 * - Keeps buttons/links inside working normally.
 */
const initMilestoneCards = () => {
  document.querySelectorAll(".c-milestone").forEach((card) => {
    const trigger = card.querySelector("[data-media-card]");
    if (!trigger) return;

    card.addEventListener("click", (e) => {
      // Ignore clicks on interactive elements
      const isInteractive = e.target.closest("button, a, [data-media-card]");
      if (isInteractive) return;

      trigger.click();
    });
  });
};

/* ============================================================
   11) Persona Flip Cards (front/back)
============================================================ */

/**
 * Enables flip interaction for persona cards.
 * Requirements:
 * - Root: [data-persona-flip]
 * - Buttons: [data-flip-to="back"] / [data-flip-to="front"]
 *
 * Behavior:
 * - Click on non-interactive area toggles flip
 * - Pauses media when returning to front
 * - Adds tabindex="0" for keyboard activation
 */
const initPersonaFlip = () => {
  document.querySelectorAll("[data-persona-flip]").forEach((card) => {
    const pauseMedia = () => {
      card.querySelectorAll("video, audio").forEach((m) => {
        try {
          m.pause();
        } catch {
          /* ignore */
        }
      });
    };

    const toFront = () => {
      card.classList.remove("is-flipped");
      pauseMedia();
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

    const toggleFlip = () => {
      card.classList.toggle("is-flipped");
      if (!card.classList.contains("is-flipped")) pauseMedia();
    };

    card.addEventListener("click", (e) => {
      // Ignore interactive children (buttons, links, media controls)
      const isInteractive = e.target.closest(
        "button, a, [data-flip-to], [data-persona-media], .js-plyr, video, audio"
      );
      if (isInteractive) return;

      toggleFlip();
    });

    // Keyboard activation when card itself is focused
    card.addEventListener("keydown", (e) => {
      if (document.activeElement !== card) return;
      handleActivation(e, toggleFlip);
    });

    // Click mode only
    card.setAttribute("data-flip-mode", "click");
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
  });
};

/* ============================================================
   12) Persona Media Tabs (inside persona back face)
============================================================ */

/**
 * Tabs for persona media panels.
 * Requirements:
 * - Tabs container: [data-persona-media]
 * - Tabs: [data-persona-tab="key"]
 * - Panels: [data-persona-panel="key"]
 */
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
            try {
              m.pause();
            } catch {
              /* ignore */
            }
          });
        }
      });
    };

    /**
     * Activate by key.
     * @param {string} key
     */
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

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => activate(btn.getAttribute("data-persona-tab")));
    });

    // Default: currently active tab, otherwise "video"
    const initialKey =
      root.querySelector("[data-persona-tab].is-active")?.getAttribute("data-persona-tab") || "video";

    activate(initialKey);
  });
};

/* ============================================================
   13) Plyr Players (optional)
============================================================ */

/**
 * Initializes Plyr players for elements with .js-plyr.
 * Optional: if Plyr is not loaded, nothing breaks.
 */
const initPlyrPlayers = () => {
  if (!window.Plyr) return;

  document.querySelectorAll(".js-plyr").forEach((el) => {
    // eslint-disable-next-line no-new
    new window.Plyr(el, {
      controls: ["play", "progress", "current-time", "mute", "volume", "settings"],
    });
  });
};

/* ============================================================
   14) Hero Stats Counter (IntersectionObserver + easing)
============================================================ */

/**
 * Hero Stats Counter
 * - Runs once when stats enter viewport
 * - Smooth easeOutCubic
 * - Supports prefix/suffix via data attributes
 *
 * Markup:
 * - Root: [data-stats]
 * - Counter: .c-counter[data-count-to][data-prefix?][data-suffix?]
 */
const initHeroStatsCounter = () => {
  const root = document.querySelector("[data-stats]");
  if (!root) return;

  const counters = Array.from(root.querySelectorAll(".c-counter[data-count-to]"));
  if (!counters.length) return;

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  /**
   * Animates a single counter element.
   * @param {HTMLElement} el
   * @param {{duration?: number}} options
   */
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

  const runAll = () => {
    counters.forEach((el, idx) => {
      // Small stagger for a premium feel
      setTimeout(() => animateCounter(el, { duration: 900 }), idx * 120);
    });
  };

  // Run once when visible
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
   15) Main Bootstrap (DOM Ready)
============================================================ */

/**
 * Boot sequence.
 * Keep startup explicit and predictable.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Theme should be applied early; still safe here for static pages.
  bootTheme();

  setActiveNavLink();
  initTabs();
  initHeroCarousel();
  initMediaModals();
  initCollectionNavigation();
  initHeaderScrollState();

  // Optional/feature-specific inits
  initCollectionCards(); // Remove if you're using delegated navigation only.
  initMilestoneCards();
  initThemeToggle();

  initPersonaFlip();
  initPersonaMediaTabs();
  initPlyrPlayers();
  initHeroStatsCounter();
});

// Expose helper for external triggers (use sparingly in production)
window.modalHelper = modalHelper;
