import { useState } from "react"
import Navbar, { type PageModal } from "./Navbar";
import PlayerBarFooter from "./PlayerBarFooter";

function App() {
  const [isAdmin, setIsAdmin] = useState(
    !!localStorage.getItem("admin_token")
  )

  const [pageModal, setPageModal] = useState<PageModal>("home")

  const setModal = (modal: PageModal) => {
    setPageModal(modal)
  }

  return (
    <>
      <Navbar setModal={setModal} setIsAdmin={setIsAdmin} isAdmin={isAdmin}/>
      <PlayerBarFooter />
    </>
  );
}

export default App;