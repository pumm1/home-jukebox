import json
from pathlib import PureWindowsPath, Path

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated

from starlette.responses import StreamingResponse, FileResponse, Response
import os
import secrets

from audioDAO import AudioDB
from file_helper import is_dir, is_not_hidden_file, make_path, list_dirs, generate_track_paths, tracks_list

MEDIA_DIR = "./Music"

CONFIG_FILE_NAME = "config.json"
CONFIG_DB_NAME = 'db_name'
config_json: dict = {}

def read_config() -> dict:
    path = ''
    if os.name == 'nt':
        path = PureWindowsPath(CONFIG_FILE_NAME)
    else:
        path = Path(f'{CONFIG_FILE_NAME}')

    filename = os.path.join(path)
    print(f'>> DEBUG secrets path: >> {filename}')
    try:
        with open(filename, mode='r') as f:
            res = json.loads(f.read())
            #print(f'>> DEBUG SECRETS CONTENTS:')
            secrets = dict(res)
            for key in secrets:
                print(f'{key}: {secrets[key]}')
            return secrets
    except FileNotFoundError:
        print(f'!! Secrets not found !!')
        return {}

config_json = read_config()

audio_db = AudioDB(config_json[CONFIG_DB_NAME])

audio_db.init_db()

CLIENT_PORT = config_json.get('client_port')

CONFIG_SOURCES = "sources"

MUSIC_DIR = "Music"

print(f'*** CONFIGURED CLIENT PORT: {CLIENT_PORT} ***')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.1.208:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

active_tokens: set[str] = set()

"""
USAGE:
# /src
uvicorn main:app --host 0.0.0.0 --port 9000

# under ui dir
npm run dev -- --host 0.0.0.0

# see own network IP
$ ipconfig getifaddr en0
<result>
# on other device within same network:
<result>:9001/test.html

about media codecs;

| Media     | Best compatibility | Good modern option | Avoid as default                                  |
| --------- | ------------------ | ------------------ | ------------------------------------------------- |
| Video     | H.264/AVC          | H.265/HEVC         | VP8, MPEG-4 Part 2                                |
| Video     | 8-bit `yuv420p`    | 10-bit HEVC        | unusual pixel formats                             |
| Audio     | AAC-LC             | Opus               | exotic codecs                                     |
| Audio     | MP3                | —                  | AC-3/E-AC-3 if broad browser support is important |
| Container | MP4                | WebM               | MKV for browser playback                          |

TODO:
- how to make sure codecs are ok?
- custom UI for streaming
"""

@app.post("/token")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    print("LOGIN ATTEMPT...")
    expected = config_json.get("internal_pw")
    payload = form_data.password
    print(f"Expected .... {expected} ... payload: {payload}")
    admin_access_passes: bool = config_json.get("internal_pw") == form_data.password
    if not admin_access_passes:
        raise HTTPException(status_code=400, detail="Invalid password")

    token = secrets.token_urlsafe(32)
    active_tokens.add(token)
    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.post("/scan")
async def scan():
    source_dirs = config_json[CONFIG_SOURCES]

    for source_dir in source_dirs:
        media_type_folders = os.listdir(source_dir)

        new_temp_metas = 0
        for media_folder in media_type_folders:  # series, movies
            media_type_dir = make_path(source_dir, media_folder)

            if media_folder == MUSIC_DIR:
                print(f'Music path: {media_type_dir}')
                artist_dirs = os.listdir(media_type_dir)

                for file_or_dir in artist_dirs:
                    file_or_dir_path = make_path(media_type_dir, file_or_dir)
                    if is_dir(file_or_dir_path):
                        artist = file_or_dir
                        artist_row = audio_db.get_artist_by_name(artist = artist)
                        artist_exists_in_db = artist_row != None
                        artist_id = None
                        if not artist_exists_in_db:
                            print(f"*** Adding new artist [artist = {artist}]")
                            artist_id = audio_db.add_artist(artist)
                        else:
                            artist_id, artist_name = artist_row
                        album_dirs_or_singles = list_dirs(file_or_dir_path)
                        for album_or_single in album_dirs_or_singles:
                            aos_path = make_path(file_or_dir_path, album_or_single)
                            is_album = is_dir(aos_path)
                            if is_album:
                                album = album_or_single
                                album_row = audio_db.get_album_by_artist_and_album_name(
                                    artist_id= artist_id, title=album
                                )
                                album_exists_in_db = album_row != None

                                album_id = None
                                if not album_exists_in_db:
                                    print(f'*** Adding new album [artist = {artist}, album = {album}]')
                                    audio_db.add_album(artist_id, album)
                                else:
                                    album_id, album_title = album_row

                                album_dir = make_path(file_or_dir_path, album)

                                album_tracks = list_dirs(album_dir)

                                track_paths = generate_track_paths(album_dir, album_tracks)
                                tracks = tracks_list(artist_id, album_id, track_paths)
                                audio_db.add_tracks(tracks)
                            elif is_not_hidden_file(album_or_single):
                                track = album_or_single
                                print(f'[Track = {track}]')
                                track_paths = generate_track_paths(file_or_dir_path, [track])
                                tracks = tracks_list(artist_id, None, track_paths)
                                audio_db.add_tracks(tracks)
            elif is_not_hidden_file(media_folder):
                print(f'Unsupported media type: {media_folder}')

    return Response(
        "OK",
        200
    )

@app.get("/stream/{path:path}")
async def stream_test(path: str, request: Request):
    file_path = os.path.join(MEDIA_DIR, path)
    print(f".. looking for file: {file_path}")

    if not os.path.isfile(file_path):
        return {"error": "Not found"}, 404

    file_size = os.path.getsize(file_path)

    range_header = request.headers.get("range")

    # No Range header -> return the whole file
    if not range_header:
        return FileResponse(
            file_path,
            media_type="audio/mp3",
            headers={
                "Accept-Ranges": "bytes",
            },
        )

    # Example: Range: bytes=1000-2000
    try:
        range_value = range_header.replace("bytes=", "")
        start_str, end_str = range_value.split("-", 1)

        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1

    except (ValueError, IndexError):
        return {"error": "Invalid range"}

    start = max(0, start)
    end = min(end, file_size - 1)

    if start > end or start >= file_size:
        return {"error": "Invalid range"}

    content_length = end - start + 1

    def iter_file():
        with open(file_path, "rb") as file:
            file.seek(start)

            remaining = content_length

            while remaining > 0:
                chunk = file.read(min(8192, remaining))

                if not chunk:
                    break

                remaining -= len(chunk)
                yield chunk

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
    }

    return StreamingResponse(
        iter_file(),
        status_code=206,
        media_type="audio/mp3",
        headers=headers,
    )
