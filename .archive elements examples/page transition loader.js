// === Page transition loader (?s disc before navigating) ===
(function setupPageTransitionLoader() {
  const DURATION_MS = 2200; // Duration of the optional transition overlay.

  // Intercept clicks on same-page links to show the transition overlay.
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;

    const href = a.getAttribute('href') || '';
    // Skip external links, downloads, anchors, or new tabs.
    if (
      a.target === '_blank' ||
      a.hasAttribute('download') ||
      href.startsWith('#') ||
      /^https?:\/\//i.test(href) && !href.startsWith(location.origin)
    ) {
      return; // Keep the default behaviour in those cases.
    }

    // Ignore navigation to the same page.
    if (href.replace(/#.*$/, '') === location.pathname.replace(/\/+$/, '')) {
      return;
    }

    ev.preventDefault();

    // Optionally show the loading disc.
    if (typeof showDisc === 'function') {
      showDisc({ withTitle: false });
    }
    setTimeout(() => {
      window.location.href = href;
    }, DURATION_MS);
  });

  // Hide the disc again when returning from bfcache.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && typeof hideDisc === 'function') hideDisc();
  });
})();
// Page transition loader end
