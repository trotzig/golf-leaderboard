module.exports = function parseJson(raw) {
  return JSON.parse(raw.replace(/:!0/g, ':false').replace(/:!1/g, ':true'));
}
