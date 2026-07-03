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

// `isValid` lets a caller reject payloads that came back empty. GolfBox
// intermittently returns an empty response for the same competition, so when a
// fetch fails validation we keep whatever good data we already have (rather than
// replacing it) and retry a few times on first load.
export function useJsonPData(url, defaultData, isValid) {
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

    let cancelled = false;
    let lastCheck;
    async function run(attempt = 0) {
      if (Date.now() - lastCheck < 30000) {
        console.log(`Less than 30s since last fetch for ${url}`);
        return;
      }
      lastCheck = Date.now();
      console.log(`Fetching ${url}`);
      const payload = await fetchJsonP(url);
      if (cancelled) {
        return;
      }
      if (isValid && !isValid(payload)) {
        console.log(`Ignoring empty response for ${url}`);
        // Don't clobber good data with an empty response; retry on first load.
        if (!CACHE[url] && attempt < 3) {
          lastCheck = 0;
          setTimeout(() => run(attempt + 1), 1000 * (attempt + 1));
        } else if (!CACHE[url]) {
          // Give up retrying and surface whatever we got so we don't hang.
          setData(payload);
        }
        return;
      }
      CACHE[url] = payload;
      setData(payload);
    }

    run();
    const onFocus = () => run();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [url]);
  return data;
}
