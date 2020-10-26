const API_URL = "https://localhost:44309/api/";

export const AUTH_ROUTE = "auth";
export const AUTH_LOGIN_ROUTE = "auth/login";
export const AUTH_LOGOUT_ROUTE = "auth/logout";
export const AUTH_REFRESH_ROUTE = "auth/refresh";

export const USER_ROUTE = "user/";

const headers = (token) => {
  return {
    Authorization: "Bearer " + token,
    Accept: "application/json",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };
};

async function CallFetch(method, route, data, token) {
  const res = await fetch(API_URL + route, {
    method: method,
    mode: "cors",
    headers: headers(token),
    body: data,
  });

  return await GetResponse(res);
}

async function GetResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // No data available
  }

  return {
    ok: response.ok,
    status: response.status,
    data: data,
  };
}

export const get = async (route, token) =>
  await CallFetch("GET", route, undefined, token);
export const post = async (route, data, token) =>
  await CallFetch("POST", route, JSON.stringify(data), token);
export const put = async (route, data, token) =>
  await CallFetch("PUT", route, JSON.stringify(data), token);
export const patch = async (route, data, token) =>
  await CallFetch("PATCH", route, JSON.stringify(data), token);
export const callDelete = async (route, data, token) =>
  await CallFetch("DELETE", route, JSON.stringify(data), token);
