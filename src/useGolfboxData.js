import { useEffect, useState } from 'react';

const CACHE = {};

export function useGolfboxData(url, defaultData) {
  const [data, setData] = useState(defaultData);
  useEffect(() => {
    if (!url) {
      return;
    }
    if (defaultData) {
      return;
    }
    const cachedData = CACHE[url];
    if (cachedData) {
      setData(cachedData);
    }

    let lastCheck;
    async function run() {
      if (Date.now() - lastCheck < 30000) {
        console.log(`Less than 30s since last fetch for ${url}`);
        return;
      }
      lastCheck = Date.now();
      console.log(`Fetching ${url}`);
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`Failed to fetch ${url}: ${res.status}`);
          return;
        }
        const data = await res.json();
        CACHE[url] = data;
        setData(data);
      } catch (e) {
        console.error(`Error fetching ${url}:`, e);
      }
    }

    run();
    window.addEventListener('focus', run);
    return () => window.removeEventListener('focus', run);
  }, [url]);
  return data;
}
