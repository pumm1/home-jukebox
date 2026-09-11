import { useEffect, useState } from 'react'
import { AudioPlayer } from './AudioPlayer'

import './PlayerBarFooter.css'
import { getTrackById, type TrackRes } from './api/client'

interface PlayerBarFooterProps {
    trackId?: number
}

const PlayerBarFooter = ({trackId}: PlayerBarFooterProps) => {

    const [track, setTrack] = useState<TrackRes | undefined>()

    useEffect(() => {
        trackId !== undefined && getTrackById(trackId).then(setTrack)
    }, [trackId])

    return (
        <nav className="playerBarFooter">
            <div className="navbar-left">
                <AudioPlayer track={track}/>
            </div>
        </nav>
    )
}

export default PlayerBarFooter