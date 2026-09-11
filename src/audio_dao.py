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

class AudioDB:
    def __init__(self, db_name: str):
        self.conn = sqlite3.connect(db_name)
        self.conn.row_factory = sqlite3.Row

        # Enable foreign-key enforcement for this connection
        self.conn.execute("PRAGMA foreign_keys = ON")

    def init_db(self):
        print(f"INITIALIZING DB...")
        self.conn.executescript(
            f"""
            CREATE TABLE IF NOT EXISTS {ARTISTS_TABLE} (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS {ALBUMS_TABLE} (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                artist_id INTEGER NOT NULL,

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
