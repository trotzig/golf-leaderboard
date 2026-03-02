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

const DB_NAME = 'jsonp-cache';
const STORE_NAME = 'responses';
const REFETCH_INTERVAL = 30_000;

let dbPromise;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = ({ target: { result: db } }) => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = ({ target: { result: db } }) => resolve(db);
      request.onerror = ({ target: { error } }) => reject(error);
    });
  }
  return dbPromise;
}

async function cacheGet(url) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(url);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function cacheSet(url, data) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(STORE_NAME, 'readwrite')
      .objectStore(STORE_NAME)
      .put({ data, fetchedAt: Date.now() }, url);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function useJsonPData(url, defaultData) {
  const [data, setData] = useState(defaultData);
  useEffect(() => {
    if (!url || defaultData) {
      return;
    }

    async function run() {
      const cached = await cacheGet(url);
      if (cached) {
        console.log('Using cached data for', url, cached.fetchedAt);
        setData(cached.data);
        if (Date.now() - cached.fetchedAt < REFETCH_INTERVAL) {
          console.log(
            `Less than 30s since last fetch for ${url}`,
            Date.now() - cached.fetchedAt,
          );
          return;
        }
      }
      console.log(`Fetching ${url}`);
      const fetched = await fetchJsonP(url);
      await cacheSet(url, fetched);
      setData(fetched);
    }

    run();
    window.addEventListener('focus', run);
    return () => window.removeEventListener('focus', run);
  }, [url]);
  return data;
}

export async function preloadJsonPData(url) {
  const data = await fetchJsonP(url);
  await cacheSet(url, data);
  return data;
}
