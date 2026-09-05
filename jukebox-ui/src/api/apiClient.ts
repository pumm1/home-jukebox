const API_URL = "https://musicbrainz.org/ws/2"

const USER_AGENT = "JukeBox/1.0.0 (https://github.com/pumm1/home-jukebox)";

export interface ReleaseListing {
    id: string
    title: string
    'first-release-date': string,
}

interface ReleaseGroups {
    "release-groups": ReleaseListing[]
}

export async function listArtistReleases(mbid: string): Promise<ReleaseListing[]> {
    const response = await fetch(`${API_URL}/release-group/?artist=${mbid}&fmt=json`, {
        headers: { "User-Agent": USER_AGENT, "Accept": "application/json", },
    });

    if (!response.ok) { 
        throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`,)
    }

    const res =  await response.json() as ReleaseGroups

    return res["release-groups"]
}