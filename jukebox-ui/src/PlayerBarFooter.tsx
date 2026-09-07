import { AudioPlayer } from './AudioPlayer'

import './PlayerBarFooter.css'

const PlayerBarFooter = ({}) => {
    return (
        <nav className="playerBarFooter">
            <div className="navbar-left">
                <AudioPlayer path='test.mp3'/>
            </div>
        </nav>
    )
}

export default PlayerBarFooter