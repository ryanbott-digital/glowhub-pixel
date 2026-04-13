import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  ogImage?: string;
}

export function SEOHead({ title, description, canonical, jsonLd, ogImage }: SEOHeadProps) {
  const fullTitle = title.includes("Glow") ? title : `${title} | Glow`;
  const baseUrl = "https://glowhub-pixel.lovable.app";
  const canonicalUrl = canonical ? `${baseUrl}${canonical}` : undefined;
  const image = ogImage || "/og-image.png";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
}

export const GLOW_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Glow Digital Signage",
  operatingSystem: "Android, FireOS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Digital Signage Software",
  description:
    "Pro digital signage software for Firestick and Android TV. Upload, schedule, and push content to remote screens in real-time.",
  offers: {
    "@type": "Offer",
    price: "9.00",
    priceCurrency: "USD",
    priceValidUntil: "2027-12-31",
    availability: "https://schema.org/InStock",
    description: "Pro Glow plan — up to 5 screens with offline caching, health monitoring, and no watermarks",
  },
  featureList: [
    "Remote screen management",
    "Offline content caching",
    "Screen health monitoring",
    "Playlist scheduling",
    "Multi-screen sync",
  ],
  screenshot: "/og-image.png",
  url: "https://glowhub-pixel.lovable.app/home",
  author: {
    "@type": "Organization",
    name: "Glow",
    url: "https://glowhub-pixel.lovable.app",
  },
};

export const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need special hardware for digital signage?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Glow works on any Amazon Fire TV Stick or Android TV device. Just sideload the app using the free Downloader tool.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if I want to add a 6th screen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Add a second Pro subscription for 5 more slots, or contact Command for Enterprise rates.",
      },
    },
    {
      "@type": "Question",
      name: "Can I play live radio like Capital or Heart?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Glow Pro includes a global radio engine to stream live UK and international stations directly in the background of your visuals.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need expensive media players?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Glow runs on any Firestick or Android TV. Just download the APK and ignite.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if my internet goes down?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Glow is built for the real world. Content is cached locally, and audio streams are buffered to ensure zero silence even if Wi-Fi flickers.",
      },
    },
    {
      "@type": "Question",
      name: "Is the free plan really free forever?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Starter plan gives you 1 screen with basic scheduling and 500 MB of storage at no cost, with no time limit and no credit card required.",
      },
    },
  ],
};
