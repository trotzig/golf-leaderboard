import { useEffect, useState } from 'react';

const CACHE = {};

export default function useData(url) {
  const [data, setData] = useState();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!url) {
      return;
    }
    const cachedData = CACHE[url];
    if (cachedData) {
      setData(cachedData);
      setIsLoading(false);
    }
    async function run() {
      const res = await fetch(url);
      if (!res.ok) {
        setData(undefined);
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      CACHE[url] = data;
      setData(data);
      setIsLoading(false);
    }
    run();
  }, [url]);
  return [data, isLoading];
}
