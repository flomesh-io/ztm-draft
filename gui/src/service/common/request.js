import { fetch } from '@tauri-apps/plugin-http';
import Cookie from './cookie'

const xsrfHeaderName = "Authorization";

const AUTH_TYPE = {
  BEARER: "Bearer",
  BASIC: "basic",
  AUTH1: "auth1",
  AUTH2: "auth2",
};

const METHOD = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PUT: "PUT",
};

async function request(url, method, params, config) {
  switch (method) {
    case METHOD.GET:
    case METHOD.POST:
    case METHOD.DELETE:
    case METHOD.PUT:
			return fetch(url, {
				method,
				header:{
					"Content-Type": "application/json"
				},
				body: !!params?JSON.stringify(params):null,
				...config
			}).then((res) => res.json());
    default:
			return fetch(url, {
				method: "GET",
				header:{
					"Content-Type": "application/json"
				},
				...config
			}).then((res) => res.json());
  }
}

async function mock(d) {
  return new Promise((resolve) => {
		resolve(d);
	});
}

async function merge(ary) {
}

function spread(callback) {
}

function setAuthorization(auth, authType = AUTH_TYPE.BASIC) {
  switch (authType) {
    case AUTH_TYPE.BEARER:
      Cookie.set(xsrfHeaderName, "Bearer " + auth.token, {
        expires: auth.expireAt,
      });
      break;
    case AUTH_TYPE.BASIC:
      Cookie.set(xsrfHeaderName, "Basic " + auth.token, { expires: auth.expireAt });
      break;
    case AUTH_TYPE.AUTH1:
    case AUTH_TYPE.AUTH2:
    default:
      break;
  }
}

function removeAuthorization(authType = AUTH_TYPE.BASIC) {
  switch (authType) {
    case AUTH_TYPE.BEARER:
      Cookie.remove(xsrfHeaderName);
      break;
    case AUTH_TYPE.BASIC:
      Cookie.remove(xsrfHeaderName);
      break;
    case AUTH_TYPE.AUTH1:
    case AUTH_TYPE.AUTH2:
    default:
      break;
  }
}

function checkAuthorization(authType = AUTH_TYPE.BASIC) {
  switch (authType) {
    case AUTH_TYPE.BEARER:
      if (Cookie.get(xsrfHeaderName)) {
        return true;
      }
      break;
    case AUTH_TYPE.BASIC:
      if (Cookie.get(xsrfHeaderName)) {
        return true;
      }
      break;
    case AUTH_TYPE.AUTH1:
    case AUTH_TYPE.AUTH2:
    default:
      break;
  }
  return false;
}

function getHeaders(headers) {
  return {
    ...headers,
    // Authorization: Cookie.get(xsrfHeaderName),
  };
}

function loadInterceptors(interceptors, options) {
  const { request, response } = interceptors;
}

function parseUrlParams(url) {
  const params = {};
  if (!url || url === "" || typeof url !== "string") {
    return params;
  }
  const paramsStr = url.split("?")[1];
  if (!paramsStr) {
    return params;
  }
  const paramsArr = paramsStr.replace(/&|=/g, " ").split(" ");
  for (let i = 0; i < paramsArr.length / 2; i++) {
    const value = paramsArr[i * 2 + 1];
    params[paramsArr[i * 2]] =
      value === "true" ? true : value === "false" ? false : value;
  }
  return params;
}

export {
  METHOD,
  AUTH_TYPE,
  request,
  merge,
  spread,
	mock,
  setAuthorization,
  removeAuthorization,
  checkAuthorization,
  loadInterceptors,
  parseUrlParams,
  getHeaders,
};
