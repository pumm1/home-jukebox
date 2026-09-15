import json
import sqlite3

"""
# TODO: run this on startup to keep foreign keys up enforced in sqlite
conn = sqlite3.connect("audio_library.db")
conn.execute("PRAGMA foreign_keys = ON")
"""

ARTISTS_TABLE = "artists"
ALBUMS_TABLE = "albums"
TRACKS_TABLE = "tracks"
RELEASE_META_TABLE = "release_metas"

# == for classes == #
ID_PARAM = 'id'
TITLE_PARAM = 'title'
NAME_PARAM = 'name'
ARTIST_NAME_PARAM = 'artist_name'
ALBUM_NAME_PARAM = 'album_name'
ALBUMS_PARAM = 'albums'
ARTIST_ID_PARAM = 'artist_id'
ALBUM_ID_PARAM = 'album_id'
MBID_PARAM = 'mbid'
MB_RELEASE_ID_PARAM = 'mb_release_id'

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


class AlbumRes:
    def __init__(self, id: int, title: str, artist_id: int, artist_name: str, mb_release_id: str | None):
        self.id = id
        self.title = title
        self.artist_id = artist_id
        self.artist_name = artist_name
        self.mb_release_id = mb_release_id

    def as_json(self):
        return {
            ID_PARAM: self.id,
            TITLE_PARAM: self.title,
            ARTIST_ID_PARAM: self.artist_id,
            ARTIST_NAME_PARAM: self.artist_name,
            MB_RELEASE_ID_PARAM: self.mb_release_id
        }


class ArtistRes:
    def __init__(self, id: int, name: str, mbid: str | None, albums: list[AlbumRes]):
        self.id = id
        self.name = name
        self.mbid = mbid
        self.albums = albums

    def as_json(self):
        albums_json = [
            album.as_json()
            for album in self.albums
        ]
        return {
            ID_PARAM: self.id,
            NAME_PARAM: self.name,
            MBID_PARAM: self.mbid,
            ALBUMS_PARAM: albums_json
        }



class AudioDB:
    def __init__(self, db_name: str):
        self.conn = sqlite3.connect(db_name, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row

        # Enable foreign-key enforcement for this connection
        self.conn.execute("PRAGMA foreign_keys = ON")

    def init_db(self):
        print(f"INITIALIZING DB...")
        self.conn.executescript(
            f"""
            CREATE TABLE IF NOT EXISTS {ARTISTS_TABLE} (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                mbid TEXT
            );

            CREATE TABLE IF NOT EXISTS {ALBUMS_TABLE} (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                artist_id INTEGER NOT NULL,
                mb_release_group_id TEXT,
                mb_release_id TEXT,

                FOREIGN KEY (artist_id)
                    REFERENCES {ARTISTS_TABLE}(id)
            );

            CREATE TABLE IF NOT EXISTS {TRACKS_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                artist_id INTEGER,
                album_id INTEGER,
                title TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                FOREIGN KEY (artist_id) REFERENCES artists(id),
                FOREIGN KEY (album_id) REFERENCES albums(id)
            );
            
            CREATE TABLE IF NOT EXISTS {RELEASE_META_TABLE} (
                mb_release_id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                image_name TEXT,
                image_data BLOB
            );

            CREATE INDEX IF NOT EXISTS idx_track_title
                ON {TRACKS_TABLE}(title);

            CREATE INDEX IF NOT EXISTS idx_track_path
                ON {TRACKS_TABLE}(path);

            CREATE INDEX IF NOT EXISTS idx_track_artist
                ON {TRACKS_TABLE}(artist_id);

            CREATE INDEX IF NOT EXISTS idx_track_album
                ON {TRACKS_TABLE}(album_id);
            """
        )

        self.conn.commit()
        print(f"*** DB INITIALIZED ***")

    # value = json as string
    def add_artist(self, name: str):
        cur = self.conn.execute(
            f"""
                INSERT INTO {ARTISTS_TABLE} (name)
                VALUES (?)
                """,
            (name,)
        )

        self.conn.commit()

        return cur.lastrowid

    def add_album(self, artist_id: int, title: str):
        cur = self.conn.execute(
            f"""
                INSERT INTO {ALBUMS_TABLE} (artist_id, title) VALUES (?, ?)
                """, [artist_id, title]
        )
        self.conn.commit()
        return cur.lastrowid

    """
    tracks = artist_id, album_id, title, path
    """
    def track_by_id(self, track_id):
        cur = self.conn.execute(
            f"""
            SELECT 
                t.id AS track_id,
                t.title AS track_title,
                t.artist_id,
                t.album_id,
                t.path,
                al.title AS album_name,
                ar.name AS artist_name
            FROM {TRACKS_TABLE} t
            LEFT JOIN {ALBUMS_TABLE} al
                ON t.album_id = al.id
            LEFT JOIN {ARTISTS_TABLE} ar
                ON t.artist_id = ar.id
            WHERE
                t.id = ?
            """, (track_id,)
        )

        return cur.fetchone()

    def search_albums(self, query: str):
        search = f"%{query}%"
        cur = self.conn.execute(
            f"""
            SELECT
                a.id AS album_id,
                a.title,
                a.artist_id,
                a.mb_release_id,
                ar.name AS artist_name,
                ar.mbid
            FROM {ALBUMS_TABLE} a
            JOIN {ARTISTS_TABLE} ar
                ON a.artist_id = ar.id
            WHERE 
                a.title LIKE ?
            OR
                ar.name LIKE ? 
            """, (search, search)
        )

        albums = []
        for row in cur.fetchall():
            artist_id = row["artist_id"]
            a = AlbumRes(
                id=row["album_id"],
                title=row["title"],
                artist_id=artist_id,
                artist_name=row["artist_name"],
                mb_release_id=row["mb_release_id"]
            )
            albums.append(a.as_json())

        return albums


    def search_tracks(self, query: str):
        search = f"%{query}%"

        cur = self.conn.execute(
            f"""
            SELECT 
                t.id AS track_id,
                t.title AS track_title,
                t.artist_id,
                t.album_id,
                al.title AS album_name,
                ar.name AS artist_name
            FROM {TRACKS_TABLE} t
            LEFT JOIN {ALBUMS_TABLE} al
                ON t.album_id = al.id
            LEFT JOIN {ARTISTS_TABLE} ar
                ON t.artist_id = ar.id
            WHERE
                t.title LIKE ?
                OR al.title LIKE ?
                OR ar.name LIKE ?
            """,
            (search, search, search)
        )

        return cur.fetchall()

    # mb_release_id
    def list_artists(self, has_mbid):
        cur = self.conn.execute(
            f"""
            SELECT
                a.id AS artist_id,
                a.name AS artist_name,
                a.mbid,
                al.id AS album_id,
                al.title AS album_title,
                al.mb_release_id
            FROM {ARTISTS_TABLE} a
            LEFT JOIN {ALBUMS_TABLE} al
                ON a.id = al.artist_id
            WHERE
                :has_mbid IS NULL
                OR (:has_mbid = TRUE AND a.mbid IS NOT NULL)
                OR (:has_mbid = FALSE AND a.mbid IS NULL)
            ORDER BY a.name, al.title
            """,
            {"has_mbid": has_mbid}
        )

        artists = {}

        for row in cur.fetchall():
            artist_id = row["artist_id"]

            if artist_id not in artists:
                artists[artist_id] = ArtistRes(
                    id=artist_id,
                    name=row["artist_name"],
                    mbid=row["mbid"],
                    albums=[]
                )

            if row["album_id"] is not None:
                artists[artist_id].albums.append(
                    AlbumRes(
                        id=row["album_id"],
                        title=row["album_title"],
                        artist_id=artist_id,
                        artist_name=row["artist_name"],
                        mb_release_id=row["mb_release_id"]
                    )
                )

        return list(artists.values())

    def update_artist(self, artist_id: int, mbid: str):
        self.conn.execute(
            f"""
            UPDATE {ARTISTS_TABLE}
            SET mbid = ?
            WHERE id = ?
            """, (mbid, artist_id, )
        )

        self.conn.commit()

    def set_album_release_id(
            self,
            album_id: int,
            release_id: str,
            data: str,
            image_name: str | None,
            image_data: bytes | None,
    ):
        self.conn.execute(
            f"""
            UPDATE {ALBUMS_TABLE}
            SET mb_release_id = ?
            WHERE id = ?
            """,
            (release_id, album_id),
        )

        self.conn.execute(
            f"""
            INSERT INTO {RELEASE_META_TABLE}
            (mb_release_id, data, image_name, image_data)
            VALUES (?, ?, ?, ?)
            """,
            (release_id, data, image_name, image_data),
        )

        self.conn.commit()


    def get_artist_by_name(self, artist: str):
        cur = self.conn.execute(
            f"""
            SELECT id, name
            FROM {ARTISTS_TABLE}
            WHERE name = ?
            """,
            (artist,)
        )

        return cur.fetchone()

    def album_img_by_release_id(self, release_id: str):
        cur = self.conn.execute(
            f"""
                    SELECT
                        image_name,
                        image_data as data
                    FROM {RELEASE_META_TABLE}
                        WHERE mb_release_id = ?
                    """,
            (release_id,)
        )

        return cur.fetchone()

    def get_album_by_artist_and_album_name(self, artist_id: int, title: str):
        cur = self.conn.execute(
            f"""
                SELECT id, title 
                FROM {ALBUMS_TABLE}
                WHERE artist_id = ? AND title = ?
            """,
            (artist_id, title,)
        )

        return cur.fetchone()

    def add_tracks(
        self,
        tracks: list[tuple[int, int | None, str, str]]
    ):
        self.conn.executemany(
            f"""
            INSERT OR IGNORE INTO {TRACKS_TABLE}
                (artist_id, album_id, title, path)
            VALUES (?, ?, ?, ?)
            """,
            tracks
        )
        self.conn.commit()

    """
        def get(self, url):
        cur = self.conn.execute(
            "SELECT data FROM metadata WHERE url=?",
            [url]
        )
        row = cur.fetchone()
        return json.loads(row[0]) if row else None
    """
