// Renders all BLOG_POSTS as cards into #blog-grid on the blog index pages
// (blog.html / blog-hr.html). Picks language from <html lang>; falls back
// to English. No React mount — keeps the same imperative innerHTML approach
// the page started with, just sourcing data from src/blog-data.jsx so we
// don't duplicate the post list per language.
(function () {
  var grid = document.getElementById("blog-grid");
  if (!grid || !window.BLOG_POSTS) return;

  var lang = document.documentElement.getAttribute("lang") === "hr" ? "hr" : "en";
  var locale = lang === "hr" ? "hr-HR" : "en-GB";
  var minRead = lang === "hr" ? "min čitanja" : "min read";
  var slugSuffix = lang === "hr" ? "-hr" : "";

  function fmt(iso) {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  }

  function escape(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  grid.innerHTML = window.BLOG_POSTS.map(function (p) {
    return '<a class="blog-card reveal" href="blog/' + escape(p.slug) + slugSuffix + '.html">' +
      '<div class="blog-card-meta">' +
        '<span class="blog-card-cat">' + escape(p.category[lang]) + '</span>' +
        '<span class="blog-card-dot">·</span>' +
        '<span class="blog-card-time">' + p.readTime + ' ' + minRead + '</span>' +
      '</div>' +
      '<h2 class="blog-card-title">' + escape(p.title[lang]) + '</h2>' +
      '<p class="blog-card-excerpt">' + escape(p.excerpt[lang]) + '</p>' +
      '<div class="blog-card-footer">' +
        '<span class="blog-card-date">' + fmt(p.date) + '</span>' +
        '<span class="blog-card-arrow">→</span>' +
      '</div>' +
    '</a>';
  }).join("");
})();
