import os


def make_path(dir_path: str, file_name: str) -> str:
    return os.path.join(dir_path, file_name)

def is_not_hidden_file(file_name: str) -> bool:
    return not file_name.startswith('.')

def is_dir(absolute_path: str) -> bool:
    return os.path.isdir(absolute_path)

def list_dirs(absolute_path: str):
    return os.listdir(absolute_path)

def tracks_list(
    artist_id: int | None,
    album_id: int | None,
    track_paths: list[tuple[str, str]]
):
    return [
        [artist_id, album_id, track, path]
        for track, path in track_paths
    ]

from pathlib import Path

def generate_track_paths(album_path: str, tracks: list[str]) -> list[tuple[str, str]]:
    album_dir = Path(album_path)

    return [
        (Path(track).stem, str(album_dir / track))
        for track in tracks
    ]