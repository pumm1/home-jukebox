import { useEffect, useRef, useState } from "react";
import { streamPath, streamPathById, type TrackRes } from "./api/client";

import playIcon from './assets/play.svg'
import pauseIcon from './assets/pause.svg'

import './AudioPlayer.css'

interface GenericIconProps {
    src: string
}

const GenericIcon = ({ src }: GenericIconProps) => (
    <div
        className="genericIcon"
        style={{
            backgroundColor: "white",
            maskImage: `url("${src}")`,
            WebkitMaskImage: `url("${src}")`,
        }}
    />
)

export const PlayIcon = ({ }) => <GenericIcon src={playIcon} />
export const PauseIcon = ({ }) => <GenericIcon src={pauseIcon} />


interface AudioPlayerProps {
    track?: TrackRes
}

export const AudioPlayer = ({ track }: AudioPlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)

    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const src = track !== undefined ? streamPathById(track.id) : undefined

    async function playAudio() {
        audioRef.current.play()

        setPlaying(true)
    }

    async function togglePlay() {
        if (!audioRef.current) return

        if (playing) {
            audioRef.current.pause()
        } else {
            await playAudio()
        }

        setPlaying(!playing)
    }

    useEffect(() => {
        if (track !== undefined) {
            audioRef.current.pause()
            setTimeout(() => {
                playAudio().then(() => setPlaying(true))
            }, 750)
        }
    }, [track])


    return (
        <div className="controlsContainer">
            {track && <span>{track.title}</span>}
            <audio
                ref={audioRef}
                src={src}
                onLoadedMetadata={() => {
                    setDuration(audioRef.current?.duration ?? 0);
                }}
                onTimeUpdate={() => {
                    setCurrentTime(audioRef.current?.currentTime ?? 0);
                }}
                onEnded={() => playAudio()}
            />

            <span className="controlsContainer">
                <button onClick={togglePlay}>
                    {playing ? <PauseIcon /> : <PlayIcon />}
                </button>
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => {
                        const time = Number(e.target.value);
                        audioRef.current!.currentTime = time;
                    }}
                />
            </span>
        </div>
    );
}
