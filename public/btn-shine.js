// Tracks pointer position over gold buttons and exposes it as --mx / --my
// CSS custom properties so the radial highlight in the background follows
// the cursor. Bails out for reduced-motion users.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('pointermove', function (e) {
    var btn = e.target.closest && e.target.closest('.btn-primary, .chat-launcher');
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    btn.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
})();
