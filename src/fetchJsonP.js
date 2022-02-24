export default function fetchJsonP(url) {
  return new Promise(resolve => {
    const rndFunctionName = `rnd_${Math.floor(Math.random() * 1000001)}`;
    window[rndFunctionName] = payload => {
      resolve(payload);
    };
    const scriptEl = document.createElement('script');
    scriptEl.src = `${url}?callback=${rndFunctionName}&_=${Date.now()}`;
    document.body.appendChild(scriptEl);
  });
}
