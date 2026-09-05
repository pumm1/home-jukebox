import json
from pathlib import PureWindowsPath, Path

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated

from starlette.responses import StreamingResponse, FileResponse
import os
import secrets

MEDIA_DIR = "./music"

SECRETS_FILE_NAME = "secrets.json"
secrets_json: dict = {}

def readSecrets() -> dict:
    path = ''
    if os.name == 'nt':
        path = PureWindowsPath(SECRETS_FILE_NAME)
    else:
        path = Path(f'{SECRETS_FILE_NAME}')

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

secrets_json = readSecrets()

CLIENT_PORT = secrets_json.get('client_port')

print(f'... CLIENT PORT: {CLIENT_PORT}')

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
    expected = secrets_json.get("internal_pw")
    payload = form_data.password
    print(f"Expected .... {expected} ... payload: {payload}")
    admin_access_passes: bool = secrets_json.get("internal_pw") == form_data.password
    if not admin_access_passes:
        raise HTTPException(status_code=400, detail="Invalid password")

    token = secrets.token_urlsafe(32)
    active_tokens.add(token)
    return {
        "access_token": token,
        "token_type": "bearer"
    }

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
        media_type="video/mp4",
        headers=headers,
    )
