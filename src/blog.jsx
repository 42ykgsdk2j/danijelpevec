// Blog section for home page — latest 3 posts as cards
function BlogSection() {
  const { t, lang } = useI18n();
  const latest = (window.BLOG_POSTS || []).slice(0, 3);

  const fmtDate = (iso) => {
    const d = new Date(iso);
    const locale = lang === "hr" ? "hr-HR" : "en-GB";
    return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  };

  const postUrl = (slug) => lang === "hr" ? `blog/${slug}-hr.html` : `blog/${slug}.html`;
  const indexUrl = lang === "hr"
    ? "https://danijelpevecadvisory-v2.vercel.app/blog-hr.html"
    : "https://danijelpevecadvisory-v2.vercel.app/blog.html";

  return (
    <section className="blog-section section-pad" id="blog">
      <div className="container">
        <div className="section-head reveal" style={{ maxWidth: "780px", marginBottom: 64 }}>
          <div className="eyebrow">{t.blog.eyebrow}</div>
          <h2>{t.blog.title} <span className="accent italic">{t.blog.titleAccent}</span></h2>
          <p className="lead">{t.blog.lead}</p>
        </div>

        <div className="blog-grid reveal-stagger">
          {latest.map((p) => (
            <a
              className="blog-card reveal"
              key={p.slug}
              href={postUrl(p.slug)}
            >
              <div className="blog-card-meta">
                <span className="blog-card-cat">{p.category[lang]}</span>
                <span className="blog-card-dot">·</span>
                <span className="blog-card-time">{p.readTime} {t.blog.minRead}</span>
              </div>
              <h3 className="blog-card-title">{p.title[lang]}</h3>
              <p className="blog-card-excerpt">{p.excerpt[lang]}</p>
              <div className="blog-card-footer">
                <span className="blog-card-date">{fmtDate(p.date)}</span>
                <span className="blog-card-arrow"><Icon.Arrow size={14} /></span>
              </div>
            </a>
          ))}
        </div>

        <div className="blog-section-cta reveal">
          <a href={indexUrl} className="btn-link">
            {t.blog.viewAll} <Icon.Arrow size={12} />
          </a>
        </div>
      </div>
    </section>
  );
}

window.BlogSection = BlogSection;
