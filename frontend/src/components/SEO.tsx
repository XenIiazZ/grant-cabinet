import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
  noindex?: boolean;
}

export function SEO({
  title,
  description,
  keywords = "гранты, поддержка, финансирование, проекты",
  image = "/logo.png",
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website",
  canonical,
  noindex = false
}: SEOProps) {
  const siteTitle = "Грантовый кабинет";
  const fullTitle = `${title} | ${siteTitle}`;
  const canonicalUrl = canonical || url;

  useEffect(() => {
    // Установка заголовка
    document.title = fullTitle;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Meta keywords
    let metaKeys = document.querySelector('meta[name="keywords"]');
    if (!metaKeys) {
      metaKeys = document.createElement('meta');
      metaKeys.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeys);
    }
    metaKeys.setAttribute('content', keywords);

    // Robots
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow');

    // Canonical link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // Open Graph
    const setOG = (prop: string, content: string) => {
      let meta = document.querySelector(`meta[property="${prop}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', prop);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    setOG('og:title', fullTitle);
    setOG('og:description', description);
    setOG('og:image', image);
    setOG('og:url', url);
    setOG('og:type', type);
    setOG('og:site_name', siteTitle);

    // Twitter Card
    const setTwitter = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    setTwitter('twitter:card', 'summary_large_image');
    setTwitter('twitter:title', fullTitle);
    setTwitter('twitter:description', description);
    setTwitter('twitter:image', image);
  }, [fullTitle, description, keywords, noindex, canonicalUrl, url, image, type, siteTitle]);

  return null;
}