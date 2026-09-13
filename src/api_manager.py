import requests

BASE_URL = "https://musicbrainz.org/ws/2"
COVER_ART_URL = "https://coverartarchive.org/release-group/"


HEADERS = {
    "User-Agent": "JukeBox/1.0.0 (https://github.com/pumm1/home-jukebox)",
    "Accept": "application/json",
}


def get_cover_art(release_id: str):
    url = f"{COVER_ART_URL}/{release_id}?fmt=json"

    response = requests.get(
        url,
        headers=HEADERS,
        timeout=30,
    )
    response.raise_for_status()

    data = response.json()

    # Prefer the approved front image
    image = next(
        (
            image
            for image in data.get("images", [])
            if image.get("front") and image.get("approved")
        ),
        None,
    )

    if image is None:
        return None, None

    image_url = image["thumbnails"]["500"]

    # Now download the actual image
    image_response = requests.get(
        image_url,
        headers=HEADERS,
        timeout=30,
    )
    image_response.raise_for_status()

    image_data = image_response.content

    return image_url, image_data

def get_release(release_id: str):
    # MusicBrainz release
    release_url = f"{BASE_URL}/release-group/{release_id}"

    release_response = requests.get(
        release_url,
        params={
            "fmt": "json",
        },
        headers=HEADERS,
        timeout=30,
    )
    release_response.raise_for_status()

    release_data = release_response.json()

    # Cover Art Archive
    image_url, image_data = get_cover_art(release_id)

    return release_data, image_url, image_data