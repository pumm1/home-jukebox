from file_helper import list_dirs, make_path, is_dir, is_not_hidden_file, generate_track_paths, tracks_list
from audio_dao import AudioDB


MUSIC_DIR = "Music"

ID_PARAM = 'id'
TITLE_PARAM = 'title'
NAME_PARAM = 'name'
ARTIST_NAME_PARAM = 'artist_name'
ALBUM_NAME_PARAM = 'album_name'
ARTIST_ID_PARAM = 'artist_id'
ALBUM_ID_PARAM = 'album_id'

track_path_cache: dict[int, str] = {}

class ArtistRes:
    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name

    def as_json(self):
        return {
            ID_PARAM: self.id,
            NAME_PARAM: self.name
        }

class AlbumRes:
    def __init__(self, id: int, title: str, artist_id: int):
        self.id = id
        self.title = title
        self.artist_id = artist_id

    def as_json(self):
        return {
            ID_PARAM: self.id,
            TITLE_PARAM: self.title,
            ARTIST_ID_PARAM: self.artist_id
        }

class TrackRes:
    def __init__(
        self,
        id: int,
        title: str,
        artist_id: int | None,
        artist_name: str | None,
        album_id: int | None,
        album_name: str | None,
    ):
        self.id = id
        self.title = title
        self.artist_id = artist_id
        self.artist_name = artist_name
        self.album_id = album_id
        self.album_name = album_name

    def as_json(self):
        return {
            ID_PARAM: self.id,
            TITLE_PARAM: self.title,
            ARTIST_ID_PARAM: self.artist_id,
            ARTIST_NAME_PARAM: self.artist_name,
            ALBUM_ID_PARAM: self.album_id,
            ALBUM_NAME_PARAM: self.album_name,
        }
def track_path_by_id(audio_db: AudioDB, track_id: int):
    path = None
    path = track_path_cache.get(track_id)

    if path is not None:
        print(f'Cache hit for track [track_id = {track_id}]')
        return path
    row = audio_db.track_by_id(track_id)
    if row is not None:
        path = row['path']
        print(f'Track path fetched [track_id = {track_id}, path = {path}]')
        track_path_cache[track_id] = path

    return path

def search_tracks(audio_db: AudioDB, query: str | None):
    if query is None:
        query = ''
    rows = audio_db.search_tracks(query)

    return [
        TrackRes(
            id=row["track_id"],
            title=row["track_title"],
            artist_id=row["artist_id"],
            artist_name=row["artist_name"],
            album_id=row["album_id"],
            album_name=row["album_name"],
        ).as_json()
        for row in rows
    ]

def get_track_by_id(audio_db: AudioDB, track_id: int):
    row = audio_db.track_by_id(track_id)

    if row is not None:
        track = TrackRes(
            id=row["track_id"],
            title=row["track_title"],
            artist_id=row["artist_id"],
            artist_name=row["artist_name"],
            album_id=row["album_id"],
            album_name=row["album_name"],
        )

        return track.as_json()
    return None



def scan_files(audio_db: AudioDB, source_dirs: list[str]):
    track_path_cache.clear()
    for source_dir in source_dirs:
        media_type_folders = list_dirs(source_dir)

        new_temp_metas = 0
        for media_folder in media_type_folders:  # series, movies
            media_type_dir = make_path(source_dir, media_folder)

            if media_folder == MUSIC_DIR:
                print(f'Music path: {media_type_dir}')
                artist_dirs = list_dirs(media_type_dir)

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
                                    album_id = audio_db.add_album(artist_id, album)
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