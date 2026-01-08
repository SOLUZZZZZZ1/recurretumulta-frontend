import React from "react";
import { Helmet } from "react-helmet";

export default function Seo({
  title = "RecurreTuMulta · Recurre multas administrativas online",
  description = "Recurre sanciones administrativas de forma automática, legal y sencilla. Tráfico, ayuntamientos y Hacienda.",
  canonical = "https://www.recurretumulta.eu",
  image = "https://www.recurretumulta.eu/og.png",
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="RecurreTuMulta" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />

      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
