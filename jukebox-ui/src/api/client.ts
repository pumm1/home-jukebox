export const API_URL = "http://192.168.1.208:9000"

export const streamPath = (file: string): string =>
  `${API_URL}/stream/${encodeURI(file)}`

export const streamPathById = (trackId: number): string =>
  `${API_URL}/stream/track/${trackId}`

export const apiFetch = async (
  path: string,
  options: RequestInit = {},
) => {
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

export const login = async (password: string) => {
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

export interface TrackRes {
  id: number
  title: string
  artist_id?: number,
  artist_name?: string
  album_id?: number
  album_name?: string
}

export interface AlbumRes {
  id: number
  title: string
  artist_id: number
  artist_name: string
  mb_release_id?: string
}

export interface ArtistRes {
  id: number
  name: string
  mbid?: string | null
  country?: string | null
  spotify?: string | null
  youtube?: string | null
  official?: string | null
  disambiguation?: string | null
  albums: AlbumRes[]
}

export const searchTracks = async (query: string): Promise<TrackRes[]> => {
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

export const getAlbum = async (album_id: number): Promise<AlbumRes> => {
  const response = await fetch(`${API_URL}/album/${album_id}`)

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`)
  }

  return await response.json() as AlbumRes
}

export const searchAlbums = async (query: string): Promise<AlbumRes[]> => {
  const params = new URLSearchParams({
    query,
  });

  const response = await fetch(
    `${API_URL}/albums?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return await response.json() as AlbumRes[]
}

export const getTrackById = async (trackId: number): Promise<TrackRes> => {
  const response = await fetch(
    `${API_URL}/track-by-id/${trackId}`
  );

  if (!response.ok) {
    throw new Error(`Track by ID failed: ${response.status}`);
  }

  return await response.json() as TrackRes;
}

export const searchArtists = async (query: string): Promise<ArtistRes[]> => {
  const params = new URLSearchParams({
    query,
  });

  const response = await fetch(
    `${API_URL}/artists?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return await response.json() as ArtistRes[];
}

export const listArtists = async (has_mbid?: boolean): Promise<ArtistRes[]> => {
  const params = new URLSearchParams();

  if (has_mbid !== undefined) {
    params.set("has_mbid", String(has_mbid));
  }

  const response = await fetch(
    `${API_URL}/list-artists?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return await response.json() as ArtistRes[];
}

export const updateArtistMBID = async (
  artist_id: number,
  mbid: string
) => {
  const response = await fetch(
    `${API_URL}/update-artist-mbid/${artist_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mbid,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`);
  }

  console.log("Artist MBID updated");
}

export const updateAlbumReleaseId = async (
  album_id: number,
  release_id: string
) => {
  const response = await fetch(
    `${API_URL}/set-album-release-id/${album_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        release_id,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`);
  }

  console.log("Artist MBID updated");
}

export const albumImgByReleaseId = async (
  releaseId: string,
  signal?: AbortSignal
) => {
  const response = await fetch(
    `${API_URL}/albums/${releaseId}/image`,
    { signal }
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch album image: ${response.status}`)
  }

  const blob = await response.blob()

  return URL.createObjectURL(blob)
}

export const albumTracks = async (album_id: number) => {
  const response = await fetch(
    `${API_URL}/album/${album_id}/tracks`
  );

  if (!response.ok) {
    return null
  }

  return await response.json() as TrackRes[];
}
