import { useEffect, useState } from 'react';

const CACHE = {};

export function useJsonPData(url, defaultData) {
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
      const res = await fetch(url);
      const data = await res.json();
      CACHE[url] = data;
      setData(data);
    }

    run();
    window.addEventListener('focus', run);
    return () => window.removeEventListener('focus', run);
  }, [url]);
  return data;
}
