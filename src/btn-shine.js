// Tracks pointer position over .btn-primary elements and exposes it as
// --mx / --my CSS custom properties so the radial highlight in the button
// background follows the cursor. Bails out for reduced-motion users.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('pointermove', function (e) {
    var btn = e.target.closest && e.target.closest('.btn-primary');
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    btn.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
})();
