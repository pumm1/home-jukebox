export const API_URL = "http://192.168.1.208:9000"

export const streamPath = (file: string): string =>
  `${API_URL}/stream/${encodeURI(file)}`

export const streamPathById = (trackId: number): string =>
  `${API_URL}/stream/track/${trackId}`

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

export interface  TrackRes{
  id: number
  title: string
  artist_id?: number,
  artist_name?: string
  album_id?: number
  album_name?: string
}

export async function search(query: string): Promise<TrackRes[]> {
  const params = new URLSearchParams({
    query,
  });

  const response = await fetch(
    `${API_URL}/search-tracks?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return await response.json() as TrackRes[];
}

export async function getTrackById(trackId: number): Promise<TrackRes> {
  const response = await fetch(
    `${API_URL}/track-by-id/${trackId}`
  );

  if (!response.ok) {
    throw new Error(`Track by ID failed: ${response.status}`);
  }

  return await response.json() as TrackRes;
}