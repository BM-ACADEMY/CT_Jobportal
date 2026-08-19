import React, { useEffect, useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { BLOGS } from '../data/blogs';
import SEOHead from '../components/seo/SEOHead';

const HtmlBlog = ({ blog }) => {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const root = hostRef.current.shadowRoot || hostRef.current.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${blog.style}</style>${blog.markup}`;
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
