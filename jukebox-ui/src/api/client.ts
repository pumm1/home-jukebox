export const API_URL = "http://192.168.1.208:9000"

export const streamPath = (file: string): string =>
  `${API_URL}/stream/${encodeURI(file)}`

export async function apiFetch(
  path: string,
  options: RequestInit = {},
) {
  const token = localStorage.getItem("admin_token");

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `API error ${response.status}: ${await response.text()}`
    );
  }

  return response;
}

export async function login(password: string) {
  const body = new URLSearchParams();

  body.set("username", "admin");
  body.set("password", password);

  const response = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Invalid password");
  }

  const data = await response.json();

  localStorage.setItem("admin_token", data.access_token);

  return data;
}

export async function scan() {
  const response = await fetch(`${API_URL}/scan`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Scan failed");
  }

  console.log(`Scan done`)
}
