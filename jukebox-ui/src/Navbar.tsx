import React from 'react';
import { login, apiFetch, streamPath } from "./api/client"
import './Navbar.css';
import { AudioPlayer } from './AudioPlayer';

export type PageModal = "home"

interface NavbarProps {
    setModal: (modal: PageModal) => void
    setIsAdmin: (isAdmin: boolean) => void
    isAdmin: Boolean
}


const Navbar = ({ isAdmin, setModal, setIsAdmin }: NavbarProps) => {
    function logout() {
        localStorage.removeItem("admin_token");
        setIsAdmin(false)
      }

    async function handleLogin() {
        const password = prompt("Admin password")

        if (!password) {
            return;
        }

        try {
            await login(password)
            setIsAdmin(true);
        } catch {
            alert("Invalid password")
        }
    }

    return (

        <nav className="navbar">
            <div className="navbar-left">
                <AudioPlayer path='test.mp3'/>
            </div>
            <div className="navbar-center">
                <ul className="nav-links">
                    <li>
                        <button onClick={() => setModal("home")}>Home</button>
                    </li>
                </ul>
            </div>
            <div className="navbar-right">
                {!isAdmin ? (
                    <button onClick={handleLogin}>
                        Admin Login
                    </button>
                ) : <button onClick={logout}>
                        Log out
                    </button>
                    }
                <a href="/account" className="user-icon">
                    <i className="fas fa-user"></i>
                </a>
            </div>
        </nav>
    );
};

export default Navbar;