import md5 from 'crypto-js/md5';

const loadTime = Date.now();

function fetchJsonP(url) {
  return new Promise(resolve => {
    const rndFunctionName = `cb_${md5(url)}`;
    window[rndFunctionName] = payload => {
      resolve(payload);
    };
    const scriptEl = document.createElement('script');
    scriptEl.src = `${url}?callback=${rndFunctionName}&_=${loadTime}`;
    document.body.appendChild(scriptEl);
  });
}

const cache = {};

async function cachedFetchJsonP(url) {
  const promise = cache[url] || fetchJsonP(url);
  const res = await promise;
  cache[url] = promise;
  return res;
}

export default fetchJsonP;

export { cachedFetchJsonP };
