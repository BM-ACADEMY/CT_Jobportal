import React, { useEffect, useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { BLOGS } from '../data/blogs';
import SEOHead from '../components/seo/SEOHead';

const BLOG_UI_OVERRIDES = `
  :host {
    display: block;
    color: #334155;
    background: #f8fafc;
  }

  ul, ol {
    padding-left: 1.65rem !important;
  }
  li > ul,
  li > ol {
    margin-top: .55rem !important;
    margin-bottom: .55rem !important;
    padding-left: 1.75rem !important;
  }
  ol { list-style-type: decimal !important; }
  ul { list-style-type: disc !important; }
  ul ul { list-style-type: circle !important; }
  ol ol { list-style-type: lower-alpha !important; }
  li {
    padding-left: .25rem;
  }
  li::marker {
    color: #059669;
    font-weight: 800;
  }

  table {
    overflow: hidden;
    border: 1px solid #dbeafe !important;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, .06);
  }
  table th {
    border-color: #bfdbfe !important;
    background: #e0f2fe !important;
    color: #0f3b5f !important;
  }
  table td { border-color: #e2e8f0 !important; }
  table tbody tr:nth-child(odd) { background: #f8fafc !important; }
  table tbody tr:nth-child(even) { background: #ecfdf5 !important; }
  table tbody tr:hover { background: #dbeafe !important; }

  /* Differentiation Accordion Component */
  .diff-accordion {
    display: flex;
    flex-direction: column;
    gap: .85rem;
    margin: 1.5rem 0 2rem;
  }
  details.diff-item {
    overflow: hidden;
    border: 1px solid #dbeafe;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 5px 18px rgba(15, 23, 42, .05);
  }
  details.diff-item[open] { border-color: #93c5fd; }
  details.diff-item summary {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    color: #0f172a;
    font-weight: 750;
    line-height: 1.45;
    cursor: pointer;
    list-style: none;
    background: #f8fafc;
    user-select: none;
  }
  details.diff-item summary::-webkit-details-marker { display: none; }
  details.diff-item summary:hover { background: #f1f5f9; }
  details.diff-item summary::after {
    content: '+';
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: #e0f2fe;
    color: #0284c7;
    font-size: 1.2rem;
    font-weight: 700;
    flex-shrink: 0;
    margin-left: .85rem;
  }
  details.diff-item[open] summary::after {
    content: '−';
    background: #dbeafe;
    color: #1d4ed8;
  }
  .diff-header-left {
    display: flex;
    align-items: center;
    gap: .65rem;
    flex-wrap: wrap;
  }
  .diff-title {
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
  }
  .diff-badge {
    display: inline-block;
    font-size: .7rem;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: .04em;
    padding: .25rem .65rem;
    border-radius: 999px;
    background: #e2e8f0;
    color: #475569;
  }
  .diff-badge-danger { background: #fee2e2; color: #b91c1c; }
  .diff-badge-success { background: #dcfce7; color: #15803d; }
  .diff-badge-blue { background: #dbeafe; color: #1d4ed8; }
  .diff-badge-purple { background: #ede9fe; color: #6d28d9; }
  .diff-badge-amber { background: #fef3c7; color: #b45309; }
  .diff-body {
    padding: 1.25rem;
    border-top: 1px solid #f1f5f9;
    background: #ffffff;
  }
  .diff-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 640px) {
    .diff-grid { grid-template-columns: 1fr; }
  }
  .diff-card {
    padding: 1rem;
    border-radius: 12px;
    font-size: .92rem;
    line-height: 1.6;
  }
  .diff-card p { margin: 0; font-size: .92rem; line-height: 1.6; }
  .diff-card-danger {
    background: #fef2f2;
    border: 1px solid #fee2e2;
    color: #991b1b;
  }
  .diff-card-success {
    background: #f0fdf4;
    border: 1px solid #dcfce7;
    color: #166534;
  }
  .diff-card-header {
    font-weight: 800;
    font-size: .82rem;
    text-transform: uppercase;
    letter-spacing: .04em;
    margin-bottom: .5rem;
    display: flex;
    align-items: center;
    gap: .35rem;
  }
  .diff-card-danger .diff-card-header { color: #dc2626; }
  .diff-card-success .diff-card-header { color: #16a34a; }
  .diff-specs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: .75rem;
  }
  .diff-spec-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: .75rem .9rem;
  }
  .diff-spec-label {
    font-size: .7rem;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: #64748b;
    margin-bottom: .25rem;
  }
  .diff-spec-value {
    font-size: .88rem;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.45;
  }

  .faq-list {
    display: grid;
    gap: .8rem;
    margin: 1.25rem 0 2.5rem;
  }
  details.faq-item {
    overflow: hidden;
    border: 1px solid #dbeafe;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 5px 18px rgba(15, 23, 42, .05);
  }
  details.faq-item[open] { border-color: #86efac; }
  details.faq-item summary {
    position: relative;
    padding: 1rem 3rem 1rem 1.1rem;
    color: #0f172a;
    font-weight: 750;
    line-height: 1.45;
    cursor: pointer;
    list-style: none;
  }
  details.faq-item summary::-webkit-details-marker { display: none; }
  details.faq-item summary::after {
    content: '+';
    position: absolute;
    top: 50%;
    right: 1.1rem;
    width: 1.7rem;
    height: 1.7rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #ecfdf5;
    color: #047857;
    font-size: 1.25rem;
    transform: translateY(-50%);
  }
  details.faq-item[open] summary::after { content: '−'; }
  details.faq-item .faq-answer {
    padding: 0 1.1rem 1rem;
    border-top: 1px solid #f1f5f9;
  }
  details.faq-item .faq-answer > :first-child { margin-top: 1rem; }
  details.faq-item .faq-answer > :last-child { margin-bottom: 0; }

  img {
    max-width: 100%;
  }
  .hero-img,
  .hero-image,
  .section-img {
    display: block !important;
    width: 100% !important;
    height: auto !important;
    aspect-ratio: 16 / 9 !important;
    object-fit: cover !important;
    object-position: center !important;
    border-radius: 18px !important;
    background: #e2e8f0;
    box-shadow: 0 10px 28px rgba(15, 23, 42, .1);
  }
  .hero-img,
  .hero-image {
    margin-top: .5rem;
  }
  .section-img {
    margin-top: 1.5rem !important;
    margin-bottom: .65rem !important;
    padding: 0;
    object-fit: cover !important;
    object-position: center !important;
    background: #e2e8f0;
  }

  .cta-wrap {
    margin: 2.25rem 0 !important;
  }
  .cta-btn,
  .final-btn,
  .wa-btn,
  a[class*="cta"],
  a[class*="btn"] {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    min-height: 48px;
    padding: .8rem 1.5rem !important;
    border: 1px solid #047857 !important;
    border-radius: 999px !important;
    background: #047857 !important;
    color: #ffffff !important;
    font-size: .95rem;
    font-weight: 750 !important;
    line-height: 1.35;
    text-align: center;
    text-decoration: none !important;
    box-shadow: 0 8px 22px rgba(4, 120, 87, .2) !important;
    transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
  }
  .cta-btn:hover,
  .final-btn:hover,
  .wa-btn:hover,
  a[class*="cta"]:hover,
  a[class*="btn"]:hover {
    background: #065f46 !important;
    color: #ffffff !important;
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(4, 120, 87, .3) !important;
  }

  .final-cta {
    position: relative;
    overflow: hidden;
    margin: 3.5rem 0 1rem !important;
    padding: 3rem 2.5rem !important;
    border: 1px solid rgba(110, 231, 183, .24) !important;
    border-radius: 24px !important;
    background: linear-gradient(135deg, #0f172a 0%, #064e3b 100%) !important;
    color: #ffffff !important;
    text-align: center;
    box-shadow: 0 22px 50px rgba(15, 23, 42, .18) !important;
  }
  .final-cta::before {
    content: '';
    position: absolute;
    width: 240px;
    height: 240px;
    right: -100px;
    top: -130px;
    border-radius: 50%;
    background: rgba(52, 211, 153, .13);
  }
  .final-cta > * {
    position: relative;
  }
  .final-cta h2,
  .final-cta h3 {
    color: #ffffff !important;
  }
  .final-cta p,
  .final-cta li {
    color: #d1fae5 !important;
  }
  .final-cta ul,
  .final-cta ol {
    display: inline-block;
    max-width: 620px;
    margin-left: auto !important;
    margin-right: auto !important;
    text-align: left;
  }
  .final-cta .cta-btn,
  .final-cta .final-btn,
  .final-cta a[class*="btn"] {
    border-color: #ffffff !important;
    background: #ffffff !important;
    color: #065f46 !important;
    box-shadow: 0 10px 26px rgba(0, 0, 0, .18) !important;
  }

  footer {
    margin-top: 4rem !important;
    padding: 3.5rem 1.5rem 1.75rem !important;
    border-top: 4px solid #10b981;
    background: #0f172a !important;
    color: #cbd5e1 !important;
  }
  footer .footer-inner {
    max-width: 1180px;
    margin: 0 auto;
  }
  footer .footer-brand {
    color: #ffffff !important;
    font-size: 1.35rem !important;
  }
  footer .footer-tag,
  footer .footer-tagline,
  footer p,
  footer .footer-contact {
    color: #cbd5e1 !important;
  }
  footer .footer-divider,
  footer hr {
    border-color: #334155 !important;
  }
  footer .copyright {
    color: #94a3b8 !important;
  }

  @media (max-width: 640px) {
    ul, ol { padding-left: 1.35rem !important; }
    .cta-btn, .final-btn, .wa-btn, a[class*="cta"], a[class*="btn"] {
      width: 100%;
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }
    .final-cta {
      padding: 2.25rem 1.25rem !important;
      border-radius: 20px !important;
    }
    footer {
      margin-top: 3rem !important;
      padding: 2.75rem 1.25rem 1.5rem !important;
    }
  }
`;

const HtmlBlog = ({ blog }) => {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const root = hostRef.current.shadowRoot || hostRef.current.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${blog.style}\n${BLOG_UI_OVERRIDES}</style>${blog.markup}`;

    // Normalize supplied FAQ markup into native, keyboard-accessible accordions.
    const faqHeading = [...root.querySelectorAll('h2')].find((heading) =>
      heading.textContent.toLowerCase().includes('frequently asked')
    );
    if (faqHeading) {
      const faqList = document.createElement('div');
      faqList.className = 'faq-list';
      let node = faqHeading.nextElementSibling;
      while (node && node.tagName !== 'H2' && !node.classList.contains('final-cta')) {
        const next = node.nextElementSibling;
        if (node.matches('.faq-item')) {
          const question = node.querySelector('h3');
          const details = document.createElement('details');
          details.className = 'faq-item';
          const summary = document.createElement('summary');
          summary.textContent = question?.textContent || 'Question';
          question?.remove();
          const answer = document.createElement('div');
          answer.className = 'faq-answer';
          while (node.firstChild) answer.appendChild(node.firstChild);
          details.append(summary, answer);
          faqList.appendChild(details);
          node.remove();
        } else if (node.tagName === 'H3') {
          const details = document.createElement('details');
          details.className = 'faq-item';
          const summary = document.createElement('summary');
          summary.textContent = node.textContent;
          const answer = document.createElement('div');
          answer.className = 'faq-answer';
          let answerNode = next;
          while (answerNode && answerNode.tagName !== 'H3' && answerNode.tagName !== 'H2' && !answerNode.classList.contains('final-cta')) {
            const answerNext = answerNode.nextElementSibling;
            answer.appendChild(answerNode);
            answerNode = answerNext;
          }
          details.append(summary, answer);
          faqList.appendChild(details);
          node.remove();
          node = answerNode;
          continue;
        }
        node = next;
      }
      faqHeading.insertAdjacentElement('afterend', faqList);
    }

    // Use the same footer content and semantic structure for every imported blog.
    const footer = root.querySelector('footer');
    if (footer) {
      footer.innerHTML = `<div class="footer-inner">
        <div class="footer-brand">Velai Vaaipu</div>
        <div class="footer-tagline">Find. Apply. Grow.</div>
        <div class="footer-contact">
          <h4>Contact Us</h4>
          <p>📞 +91 99445 09441</p>
          <p>📍 Puducherry, Tamil Nadu, India</p>
        </div>
        <hr class="footer-divider">
        <div class="copyright">© 2026 Velai Vaaipu. All rights reserved.</div>
      </div>`;
    }
  }, [blog]);

  return <div ref={hostRef} className="block min-h-screen bg-slate-50" />;
};

const BlogDetails = ({ staticSlug }) => {
  const { slug: paramSlug } = useParams();
  const slug = staticSlug || paramSlug;
  const blog = BLOGS.find((item) => item.slug === slug);
  if (!blog) return <Navigate to="/blog" replace />;
  return <><SEOHead title={`${blog.title} | Velaivaaipu`} description={blog.excerpt} path={staticSlug ? `/${staticSlug}` : `/blog/${blog.slug}`} schema={{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: blog.title, image: blog.image, datePublished: blog.date, author: { '@type': 'Organization', name: 'Velaivaaipu' } }} /><HtmlBlog blog={blog} /></>;
};

export default BlogDetails;
