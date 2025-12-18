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
  document.querySelectorAll("[data-tabs-root]").forEach((root) => {
    const tabs = root.querySelectorAll("[data-tabs] .c-tab");
    const panels = root.querySelectorAll(".c-tab-panel");

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
    if (!videoMount) return;

    // Clear previous content
    videoMount.innerHTML = "";

    // If no video provided: render nothing (keep the modal clean)
    if (!videoUrl) return;

    const isEmbed = /youtube\.com\/embed|player\.vimeo\.com|https?:\/\//i.test(videoUrl) && !/\.mp4(\?|$)/i.test(videoUrl);

    if (isEmbed) {
      const iframe = document.createElement("iframe");
      iframe.src = videoUrl;
      iframe.title = "مشغل الفيديو";
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "true");
      iframe.className = "c-modal__video-frame";
      videoMount.appendChild(iframe);
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
    videoMount.appendChild(video);
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
});

// Expose helper for debugging or external triggers (use sparingly in production).
window.modalHelper = modalHelper;
