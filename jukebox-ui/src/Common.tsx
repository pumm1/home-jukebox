import { useState } from 'react'

import copied from './assets/copied.svg'
import copy from './assets/copy.svg'
import pauseIcon from './assets/pause.svg'
import playIcon from './assets/play.svg'


interface GenericIconProps {
    src: string
}

export const GenericIcon = ({ src }: GenericIconProps) => (
    <div
        className="genericIcon"
        style={{
            backgroundColor: "white",
            maskImage: `url("${src}")`,
            WebkitMaskImage: `url("${src}")`,
        }}
    />
)

//TODO: move to common place
export const PlayIcon = ({ }) => <GenericIcon src={playIcon} />
export const PauseIcon = ({ }) => <GenericIcon src={pauseIcon} />

export const CopyIcon = ({}) => <GenericIcon src={copy}/>
export const CopiedIcon = ({}) => <GenericIcon src={copied}/>

interface TextToCopyProps {
    text: string
}

export const TextToCopy = ({ text }: TextToCopyProps) => {
    const [isCopied, setIsCopied] = useState(false)

    const copy = () => {
        setIsCopied(true)
        setTimeout(() => {
            navigator.clipboard.writeText(text)
            setIsCopied(false)
        }, 2500)
    }

    return (
        <span className="copyRow">
            <button onClick={() => copy()}>
                {text}
            </button>
            {isCopied ? <span className="copyRow"><CopiedIcon /> Copied!</span> : <CopyIcon />}
        </span>
    )
}