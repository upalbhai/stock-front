import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "./seo";
import { CONTACT_EMAIL } from "./constants";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.webp`,
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL,
      contactType: "customer support",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    operatingSystem: "Windows, macOS, Android, iOS, Web",
    applicationCategory: "BusinessApplication",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: `${SITE_URL}/logo.webp`,
    screenshot: `${SITE_URL}/opengraph-image`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "0",
      highPrice: "999",
      offerCount: 3,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "128",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "Sub-second barcode checkout and POS thermal receipts",
      "Loose unit to master carton inventory synchronization",
      "Digital customer udhar khata and credit ledgers",
      "GST tax invoices with CGST, SGST, IGST calculations",
      "Multi-outlet and central godown stock transfers",
      "Role-based staff permissions with cashier PIN login"
    ],
  };
}

export function industrySolutionSchema(industry: {
  name: string;
  slug: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `MiniHisab for ${industry.name}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Windows, macOS, Android, iOS, Web",
    description: industry.description,
    url: `${SITE_URL}/for/${industry.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "0",
      offerCount: 3,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "128",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact MiniHisab",
    url: `${SITE_URL}/contact`,
    description: "Contact MiniHisab for retail billing, inventory, and operations support.",
  };
}

export function serviceListSchema(services: { title: string; text: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service.title,
        description: service.text,
        provider: {
          "@type": "Organization",
          name: SITE_NAME,
        },
      },
    })),
  };
}
