import { useEffect, useState } from 'react';
import md5 from 'crypto-js/md5';

export default function fetchJsonP(url) {
  return new Promise(resolve => {
    const rndFunctionName = `cb_${md5(url)}`;
    window[rndFunctionName] = payload => {
      resolve(payload);
    };
    const scriptEl = document.createElement('script');
    scriptEl.src = `${url}?callback=${rndFunctionName}&_=${Date.now()}`;
    document.body.appendChild(scriptEl);
  });
}

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
      const data = await fetchJsonP(url);
      CACHE[url] = data;
      setData(data);
    }

    run();
    window.addEventListener('focus', run);
    return () => window.removeEventListener('focus', run);
  }, [url]);
  return data;
}
