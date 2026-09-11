import { useEffect, useState } from 'react'
import { search } from './api/client'

import type { TrackRes } from './api/client'

import './Library.css'
import { PlayIcon } from './AudioPlayer'

interface TrackRowProps {
    track: TrackRes
    setTrack: (id: number) => void
    showPlay?: boolean
}
export const TrackRow = ({ track, setTrack, showPlay }: TrackRowProps) => {
    const { album_name, artist_name, title } = track

    return (
        <div className="listRow">
            <div className="track">
                <div className="trackMain">
                    <span className="trackTitle">{title}</span>
                    {artist_name && (
                        <span className="artist">{artist_name}</span>
                    )}
                </div>

                {album_name && (
                    <div className="album">{album_name}</div>
                )}
            </div>

            {showPlay && (
                <button onClick={() => setTrack(track.id)}>
                    <PlayIcon />
                </button>
            )}
        </div>
    )
}

export interface LibraryProps {
    setTrack: (id: number) => void
}

export const Library = ({ setTrack }: LibraryProps) => {
    const [query, setQuery] = useState('')
    const [tracks, setTracks] = useState<TrackRes[]>([])

    useEffect(() => {
        search(query).then(setTracks)
    }, [query])


    return (
        <div>
            <div className='search'>
                <input placeholder='Search..' type='text' onChange={e => setQuery(e.target.value)} />
            </div>
            <br />
            <div className='tracks'>
                {tracks.map(t => <TrackRow setTrack={setTrack} track={t} showPlay={true} />)}
            </div>
        </div>
    )
}