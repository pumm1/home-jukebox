import { useState } from "react"
import Navbar, { type PageModal } from "./Navbar";
import PlayerBarFooter from "./PlayerBarFooter";
import { Library } from './Library'

function App() {
  const [isAdmin, setIsAdmin] = useState(
    !!localStorage.getItem("admin_token")
  )

  const [pageModal, setPageModal] = useState<PageModal>("home")
  const [trackId, setTrackId] = useState<number | undefined>(undefined)

  const setModal = (modal: PageModal) => {
    setPageModal(modal)
  }

  return (
    <>
      <Navbar setModal={setModal} setIsAdmin={setIsAdmin} isAdmin={isAdmin}/>
      <Library setTrack={setTrackId}/>
      <PlayerBarFooter trackId={trackId}/>
    </>
  );
}

export default App;