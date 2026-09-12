import { useState } from "react"
import Navbar, { type PageModal } from "./Navbar";
import PlayerBarFooter from "./PlayerBarFooter";
import { Library } from './Library'
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

  const [pageModal, setPageModal] = useState<PageModal>("home")
  const [trackId, setTrackId] = useState<number | undefined>(undefined)

  const ShownModal = ({ }) => {
    switch (pageModal) {
      case 'home':
        return <Library setTrack={setTrackId} />
      case 'settings':
        return <Settings />
      default:
        throw new Error(`Invalid page! ${pageModal}`);
    }
  }

  return (
    <div className="app">
      <Navbar
        setModal={setPageModal}
        setIsAdmin={setIsAdmin}
        isAdmin={isAdmin}
      />
  
      <PageContents>
        <ShownModal />
      </PageContents>
  
      <PlayerBarFooter trackId={trackId} />
    </div>
  );
}

export default App;