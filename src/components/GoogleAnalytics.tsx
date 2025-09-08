'use client';

import Script from 'next/script';
import { siteConfig } from '@/config/site';

interface GoogleAnalyticsProps {
  nonce?: string;
}

export function GoogleAnalytics({ nonce }: GoogleAnalyticsProps) {
  const GA_TRACKING_ID = (siteConfig.analytics.googleAnalyticsId || '').trim();

  // Respect configuration: if no GA ID is provided, do not inject scripts
  // Enforces STANDARDS: Security & Configuration (no-op when unset)
  if (!GA_TRACKING_ID || !/^G-[A-Z0-9]+$/i.test(GA_TRACKING_ID)) {
    return null;
  }

  return (
    <>
      <Script
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);} 
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}');
        `}
      </Script>
    </>
  );
}
