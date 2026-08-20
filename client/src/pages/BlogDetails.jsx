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
  li {
    padding-left: .25rem;
  }
  li::marker {
    color: #059669;
    font-weight: 800;
  }

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
  }, [blog]);

  return <div ref={hostRef} className="block min-h-screen bg-slate-50" />;
};

const BlogDetails = () => {
  const { slug } = useParams();
  const blog = BLOGS.find((item) => item.slug === slug);
  if (!blog) return <Navigate to="/blog" replace />;
  return <><SEOHead title={`${blog.title} | Velaivaaipu`} description={blog.excerpt} path={`/blog/${blog.slug}`} schema={{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: blog.title, image: blog.image, datePublished: blog.date, author: { '@type': 'Organization', name: 'Velaivaaipu' } }} /><HtmlBlog blog={blog} /></>;
};

export default BlogDetails;
