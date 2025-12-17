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

});

// Expose helper for debugging or external triggers (use sparingly in production).
window.modalHelper = modalHelper;
