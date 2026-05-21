import type { MetadataRoute } from 'next'

const BASE = 'https://nghm.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/equipe`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/projetos`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/publicacoes`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/calendario`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/ferramentas`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
