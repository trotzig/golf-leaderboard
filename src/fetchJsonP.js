import md5 from 'crypto-js/md5';

const loadTime = Date.now();

export default function fetchJsonP(url) {
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
