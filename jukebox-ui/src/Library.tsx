import { useEffect, useState } from 'react'
import { albumImgByReleaseId, searchAlbums, searchTracks } from './api/client'

import type { AlbumRes, TrackRes } from './api/client'

import './Library.css'
import { PlayIcon } from './Common'

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
}

export const TrackRow = ({ track, setTrack, showPlay }: TrackRowProps) => {
    const { album_name, artist_name, title } = track

    return (
        <div className="listRow">
            <ListingRow mainItem={<>{title}</>} secondaryItem={<>{artist_name}</>} additionalItem={<>{album_name}</>} />

            {showPlay && (
                <button onClick={() => setTrack(track.id)}>
                    <PlayIcon />
                </button>
            )}
        </div>
    )
}

interface AlbumRowProps {
    album: AlbumRes
    setTrack: (id: number) => void
}

export const AlbumRow = ({ album }: AlbumRowProps) => {
    const { artist_name, title } = album

    const [img, setImg] = useState<string | null>(null)

    useEffect(() => {
        album.mb_release_id !== undefined && albumImgByReleaseId(album.mb_release_id).then(setImg)
    }, [album.mb_release_id])

    return (
        <div className="listRow">
            <ListingRow mainItem={<>{title}</>} additionalItem={<>{artist_name}</>} />
            {img && <img className="thumbnail" src={img}/>}
        </div>
    )
}

export interface LibraryProps {
    setTrack: (id: number) => void
}

const TrackLibrary = ({ setTrack }: LibraryProps) => {
    const [query, setQuery] = useState('')
    const [tracks, setTracks] = useState<TrackRes[]>([])

    useEffect(() => {
        searchTracks(query).then(setTracks)
    }, [query])

    return (
        <>
            <div className='search'>
                <input placeholder='Search..' type='text' onChange={e => setQuery(e.target.value)} />
            </div>
            <br />
            <div className='tracks'>
                {tracks.map(t => <TrackRow setTrack={setTrack} track={t} showPlay={true} />)}
            </div>
        </>
    )
}

const AlbumLibrary = ({ setTrack }: LibraryProps) => {
    const [query, setQuery] = useState('')
    const [albums, setAlbums] = useState<AlbumRes[]>([])

    useEffect(() => {
        searchAlbums(query).then(setAlbums)
    }, [query])

    return (
        <>
            <div className='search'>
                <input placeholder='Search..' type='text' onChange={e => setQuery(e.target.value)} />
            </div>
            <br />
            <div className='tracks'>
                {albums.map(a => <AlbumRow setTrack={setTrack} album={a} />)}
            </div>
        </>
    )
}

type LibraryModal = 'Tracks' | 'Albums'

export const Library = ({ setTrack }: LibraryProps) => {

    const [libraryModal, setLibraryModal] = useState<LibraryModal>('Tracks')

    return (
        <div>
            <div className='search'>
                <span>
                    <button onClick={() => setLibraryModal('Tracks')}>Tracks</button>
                    <button onClick={() => setLibraryModal('Albums')}>Albums</button>
                </span>
            </div>
            {
                libraryModal === 'Tracks' ? <TrackLibrary setTrack={setTrack} /> : <AlbumLibrary setTrack={setTrack}/>
            }
        </div>
    )
}