// Subtle scroll-reveal for static pages. Each .reveal element fades and
// slides into view as it enters the viewport. Above-fold elements get .in
// on the first observer tick (no perceptible delay).
//
// MutationObserver re-observes any .reveal elements added later — including
// blog cards rendered by blog-list-render.jsx and React content mounted by
// blog-nav-mount.jsx — so late-inserted nodes don't get stuck invisible.
(function () {
  // If the user prefers reduced motion, just show everything immediately
  // and keep doing so for any .reveal elements added later.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var revealAll = function () {
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { el.classList.add('in'); });
    };
    revealAll();
    new MutationObserver(revealAll).observe(document.body, { childList: true, subtree: true });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  var observeAll = function () {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { io.observe(el); });
  };

  observeAll();
  new MutationObserver(observeAll).observe(document.body, { childList: true, subtree: true });
})();
