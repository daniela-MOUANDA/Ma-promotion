const KEY = "epca.admin.session";
const TOKEN = "epca.admin.token";

export function isAdminAuthenticated() {
  return sessionStorage.getItem(KEY) === "1";
}

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN) ?? "";
}

export function setAdminSession(token?: string) {
  sessionStorage.setItem(KEY, "1");
  if (token) sessionStorage.setItem(TOKEN, token);
}

export function clearAdminSession() {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem(TOKEN);
}
