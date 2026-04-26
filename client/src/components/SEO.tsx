import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'SaaSLink | Global School Management System',
  description = 'Empower your educational institution with SaaSLink. A unified ERP for students, finance, staff, and learning management specialized for the Kenyan and global markets.',
  keywords = 'school management system, ERP for schools, education software, student records, fee collection, LMS, SaaSLink',
  canonical = 'https://saaslink.app',
  ogType = 'website',
  ogImage = '/og-image.png',
}) => {
  const siteTitle = title.includes('SaaSLink') ? title : `${title} | SaaSLink`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Mobile Meta */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#6366f1" />
    </Helmet>
  );
};

export default SEO;
