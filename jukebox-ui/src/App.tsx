import { useState } from "react"
import Navbar, { type PageModal } from "./Navbar";
import PlayerBarFooter from "./PlayerBarFooter";
import { TrackLibrary, AlbumLibrary, ArtistLibrary } from './Library'
import Settings from "./Settings";

import './App.css'

const PageContents = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="pageContents">
      {children}
    </div>
  );
};

function App() {
  const [isAdmin, setIsAdmin] = useState(
    !!localStorage.getItem("admin_token")
  )

  const [pageModal, setPageModal] = useState<PageModal>("tracks")
  const [trackId, setTrackId] = useState<number | undefined>(undefined)

  return (
    <div className="app">
      <Navbar
        setModal={setPageModal}
        setIsAdmin={setIsAdmin}
        isAdmin={isAdmin}
      />

      <PageContents>
        {pageModal === 'tracks' && <TrackLibrary setTrack={setTrackId} />}
        {pageModal === 'albums' && <AlbumLibrary setTrack={setTrackId} />}
        {pageModal === 'artists' && <ArtistLibrary />}
        {pageModal === 'settings' && <Settings />}
      </PageContents>

      <PlayerBarFooter trackId={trackId} />
    </div>
  );
}

export default App;