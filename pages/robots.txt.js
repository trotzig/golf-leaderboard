import React from 'react';

const { BASE_URL } = process.env;

const Robots = () => {};

export async function getServerSideProps({ res }) {
  const content = `
User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
  `.trim();

  res.setHeader('Content-Type', 'text/plain');
  res.write(content);
  res.end();

  return {
    props: {},
  };
}

export default Robots;
