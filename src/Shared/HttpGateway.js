export class HttpError extends Error {
  constructor(text, httpCode) {
    super(`Got HTTP code ${httpCode}: ${text}`);
    this.text = text;
    this.httpCode = httpCode;
  }
}

function responseHandler(res) {
  if (!res.ok) throw new HttpError(res.statusText, res.status);
  return res.json();
}

export default function httpGateWay(
  base = "https://api.logicroom.co/api/carlerik@gmail.com"
) {
  return {
    get(path) {
      return fetch(`${base}${path}`).then(responseHandler);
    },
    post(path, data) {
      return fetch(`${base}${path}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json"
        }
      }).then(responseHandler);
    }
  };
}
