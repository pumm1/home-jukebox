import { useEffect, useState } from 'react'
import { albumImgByReleaseId, albumTracks, getAlbum, searchAlbums, searchArtists, searchTracks } from './api/client'

import type { AlbumRes, ArtistRes, TrackRes } from './api/client'

import './Library.css'
import { PlayIcon } from './Common'
import { DividedContents } from './DividedContents'

interface ListingRowProps {
    mainItem: React.ReactElement
    secondaryItem?: React.ReactElement
    additionalItem?: React.ReactElement
}

export const ListingRow = ({ mainItem, secondaryItem, additionalItem }: ListingRowProps) =>
    <div className="track">
        <div className="trackMain">
            <span className="trackTitle">{mainItem}</span>
            {secondaryItem && (
                <span className="artist">{secondaryItem}</span>
            )}
        </div>

        {additionalItem && (
            <div className="album">{additionalItem}</div>
        )}
    </div>


interface TrackRowProps {
    track: TrackRes
    setTrack: (id: number) => void
    showPlay?: boolean
    setAlbum?: (id: number) => void
}

export const TrackRow = ({ track, setTrack, showPlay, setAlbum }: TrackRowProps) => {
    const { album_name, album_id, artist_name, title } = track
    const showAlbumInfo: boolean = !!album_id && !!setAlbum
    return (
        <div className="listRow">
            <ListingRow mainItem={<>{title}</>} secondaryItem={<>{artist_name}</>} additionalItem={showAlbumInfo && <span className='trackAlbum' onClick={() => setAlbum(album_id)}>{album_name}</span>} />

            {showPlay && (
                <button onClick={() => setTrack(track.id)}>
                    <PlayIcon />
                </button>
            )}
        </div>
    )
}

interface ArtistRowProps {
    artist: ArtistRes
    setArtist: (a: ArtistRes) => void
}

export const ArtistRow = ({ artist, setArtist }: ArtistRowProps) => {
    return (
        <div className="listRow" onClick={() => setArtist(artist)}>
            <ListingRow
                mainItem={<>{artist.name}</>}
            />
        </div>
    )
}

interface PlainAlbumRowProps {
    album: AlbumRes
    hideArtist?: boolean
    onClick?: () => void
}

const PlainAlbumRow = ({ album, hideArtist, onClick }: PlainAlbumRowProps) => {
    const { artist_name, title } = album
    const [img, setImg] = useState<string | null>(null)

    useEffect(() => {
        if (album.mb_release_id === undefined) {
            setImg(null)
            return
        }

        const controller = new AbortController()
        let objectUrl: string | null = null

        albumImgByReleaseId(album.mb_release_id, controller.signal)
            .then(url => {
                if (url !== null) {
                    objectUrl = url
                    setImg(url)
                }
            })
            .catch(error => {
                if (error.name !== 'AbortError') {
                    console.error('Failed to load album image', error)
                }
            })

        return () => {
            controller.abort()

            if (objectUrl !== null) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [album.mb_release_id])

    return (
        <div className="listRow" style={onClick === undefined ? { "pointerEvents": "none" } : undefined} onClick={onClick}>
            <ListingRow
                mainItem={<>{title}</>}
                additionalItem={!!hideArtist ? undefined : <>{artist_name}</>}
            />
            {img && <img className="thumbnail" src={img} />}
        </div>
    )
}

interface AlbumRowProps extends PlainAlbumRowProps {
    setTrack: (id: number) => void
    setAlbum?: (album: AlbumRes) => void
}

export const AlbumRow = ({ album, setAlbum }: AlbumRowProps) =>
    <PlainAlbumRow album={album} onClick={() => setAlbum(album)} />

interface TrackListProps {
    tracks: TrackRes[]
    setTrack: (id: number) => void
    setAlbum?: (id: number) => void
}

const TrackList = ({ tracks, setTrack, setAlbum }: TrackListProps) =>
    <div className='tracks'>
        {tracks.map(t => <TrackRow key={`track-${t.id}`} setTrack={setTrack} track={t} showPlay={true} setAlbum={setAlbum} />)}
    </div>

export interface LibraryProps {
    setTrack: (id: number) => void
}

export const TrackLibrary = ({ setTrack }: LibraryProps) => {
    const [query, setQuery] = useState('')
    const [tracks, setTracks] = useState<TrackRes[]>([])
    const [selectedAlbum, setSelectedAlbum] = useState<number | undefined>()
    const [album, setAlbum] = useState<AlbumRes | undefined>()
    const [additionalTracks, setAdditionalTracks] = useState<TrackRes[]>([])

    useEffect(() => {
        !!selectedAlbum && getAlbum(selectedAlbum).then(setAlbum).then(() => albumTracks(selectedAlbum).then(setAdditionalTracks))
    }, [selectedAlbum])

    useEffect(() => {
        searchTracks(query).then(setTracks)
    }, [query])

    return (
        <DividedContents
            content1={
                <>
                    <div className='search'>
                        <input placeholder='Search tracks..' type='text' onChange={e => setQuery(e.target.value)} />
                    </div>
                    <br />
                    <TrackList setTrack={setTrack} tracks={tracks} setAlbum={setSelectedAlbum} />
                </>
            }
            content2={
                !!album ?
                    <>
                        {selectedAlbum !== undefined && <h3>{album.title}</h3>}
                        <TrackList setTrack={setTrack} tracks={additionalTracks} />
                    </>
                    :
                    <></>
            }
        />
    )
}

export const AlbumLibrary = ({ setTrack }: LibraryProps) => {
    const [query, setQuery] = useState('')
    const [albums, setAlbums] = useState<AlbumRes[]>([])
    const [selectedAlbum, setSelectedAlbum] = useState<AlbumRes | undefined>(undefined)
    const [selectedAlbumTracks, setSelectedAlbumTracks] = useState<TrackRes[]>([])

    useEffect(() => {
        searchAlbums(query).then(setAlbums)
    }, [query])


    useEffect(() => {
        selectedAlbum !== undefined && albumTracks(selectedAlbum.id).then(setSelectedAlbumTracks)
    }, [selectedAlbum])

    return (
        <DividedContents
            content1={
                <>
                    <div className="search">
                        <input
                            placeholder="Search albums.."
                            type="text"
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                    <br />
                    <div className="tracks">
                        {albums.map(a =>
                            <AlbumRow
                                key={`album-${a.id}`}
                                setAlbum={setSelectedAlbum}
                                setTrack={setTrack}
                                album={a}
                            />
                        )}
                    </div>
                </>
            }
            content2={
                <>
                    {selectedAlbum !== undefined && <h3>{selectedAlbum.title}</h3>}
                    <TrackList setTrack={setTrack} tracks={selectedAlbumTracks} />
                </>
            }
        />
    )
}

type Param = {
    key: string
    name: string
    value: React.ReactNode
}

interface ParamModalProps {
    params: Param[]
}
const ParamModal = ({ params }: ParamModalProps) =>
    <div className="param-list">
        {params.map(({ name, value, key }) => (
            !!value &&
            <div className="param-row" key={key}>
                <dt>{name}</dt>
                <dd>{value}</dd>
            </div>
        )
        )}
    </div>

interface ArtistInfoProps {
    artist: ArtistRes
}

const ArtistInfo = ({ artist }: ArtistInfoProps) => {
    const { id, name, country, youtube, spotify, official, disambiguation, albums } = artist

    const artistParams: Param[] = [
        { key: `artist-${id}`, name: 'Artist', value: <b>{name}</b> },
        { key: `artist-info-${id}`, name: 'Info', value: disambiguation },
        { key: `artist-country-${id}`, name: 'Country', value: country },
        { key: `artist-official-${id}`, name: '', value: official ? <a href={official}>Official Website</a> : undefined },
        { key: `artist-youtube-${id}`, name: '', value: youtube ? <a href={youtube}>YouTube</a> : undefined },
        { key: `artist-spotify-${id}`, name: '', value: spotify ? <a href={spotify}>Spotify</a> : undefined },
    ]

    return (
        <div className='artistInfo'>
            <ParamModal params={artistParams} />

            {albums.map(a =>
                <PlainAlbumRow
                    key={`artist-${id}-album-${a.id}`}
                    album={a}
                    hideArtist
                />)}
        </div>
    )
}

export const ArtistLibrary = ({ }) => {
    const [query, setQuery] = useState('')
    const [artists, setArtists] = useState<ArtistRes[]>([])
    const [selectedArtist, setArtist] = useState<ArtistRes | undefined>(undefined)

    useEffect(() => {
        searchArtists(query).then(setArtists)
    }, [query])

    return (
        <DividedContents
            content1={
                <>
                    <div className="search">
                        <input
                            placeholder="Search artists.."
                            type="text"
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                    <br />
                    <div className="tracks">
                        {artists.map(a =>
                            <ArtistRow
                                key={`artist-${a.id}`}
                                artist={a}
                                setArtist={setArtist}
                            />
                        )}
                    </div>
                </>
            }
            content2={
                <>
                    {selectedArtist !== undefined && <ArtistInfo artist={selectedArtist} />}
                </>
            }
        />
    )
}

