import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { getSession, clearSession, logout as logoutRequest } from "../auth";

export default function Navbar({ variant = "landing" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const session = getSession();

  async function handleLogout() {
    await logoutRequest(session?.token);
    clearSession();
    navigate("/");
  }

  const landingLinks = (
    <>
      <a className="nav-link" href="#home" onClick={() => setMenuOpen(false)}>
        Home
      </a>
      <a className="nav-link" href="#how-it-works" onClick={() => setMenuOpen(false)}>
        How it Works
      </a>
      <a className="nav-link" href="#about" onClick={() => setMenuOpen(false)}>
        About
      </a>
      <Link className="nav-link" to="/dashboard" onClick={() => setMenuOpen(false)}>
        Live Map
      </Link>
    </>
  );

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <Logo />
        Rakshak
      </Link>

      {variant === "landing" && <div className="nav-links">{landingLinks}</div>}

      <div className="nav-right">
        {variant === "landing" &&
          (session ? (
            <Link className="btn btn-primary" to="/dashboard">
              Dashboard
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/login">
              Log In / Sign Up
            </Link>
          ))}

        {variant === "app" && session && (
          <>
            <span style={{ color: "var(--text-dim)", fontSize: 14 }}>Hi, {session.name}</span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Log out
            </button>
          </>
        )}

        {variant === "landing" && (
          <button className="nav-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            ☰
          </button>
        )}
      </div>

      {variant === "landing" && (
        <div className={`nav-mobile-menu${menuOpen ? " open" : ""}`}>{landingLinks}</div>
      )}
    </nav>
  );
}
