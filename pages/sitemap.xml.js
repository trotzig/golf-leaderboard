import React from 'react';
import prisma from '../src/prisma.mjs';
import generateSlug from '../src/generateSlug.mjs';

const { BASE_URL } = process.env;

const Sitemap = () => {};

export async function getServerSideProps({ res }) {
  const players = await prisma.player.findMany();
  const competitions = await prisma.competition.findMany();

  let lastCompUpdatedAt = new Date(0);
  for (const c of competitions) {
    if (lastCompUpdatedAt < c.updatedAt) {
      lastCompUpdatedAt = c.updatedAt;
    }
  }

  let lastPlayerUpdatedAt = new Date(0);
  for (const p of players) {
    if (lastPlayerUpdatedAt < p.updatedAt) {
      lastPlayerUpdatedAt = p.updatedAt;
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${BASE_URL}/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${BASE_URL}/schedule</loc>
        <lastmod>${lastCompUpdatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${BASE_URL}/players</loc>
        <lastmod>${lastPlayerUpdatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${BASE_URL}/oom</loc>
        <lastmod>${lastPlayerUpdatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
      ${competitions
        .map(competition => {
          return `
            <url>
              <loc>${BASE_URL}/competitions/${competition.id}</loc>
              <lastmod>${(competition.start > new Date()
                ? competition.updatedAt
                : competition.start
              ).toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>1.0</priority>
            </url>
          `;
        })
        .join('')}
      ${players
        .map(player => {
          return `
            <url>
              <loc>${BASE_URL}/${generateSlug(player)}</loc>
              <lastmod>${player.updatedAt.toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>1.0</priority>
            </url>
          `;
        })
        .join('')}
    </urlset>
  `;

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default Sitemap;
