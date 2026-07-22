import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">🎟️</span>
          <span className="navbar-logo-text">
            Ticket<span className="text-gradient">eira</span>
          </span>
        </Link>

        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Explorar
          </NavLink>
          <NavLink to="/meus-ingressos" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Meus ingressos
          </NavLink>
          <NavLink to="/painel" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Painel
          </NavLink>
        </nav>

        <Link to="/criar" className="btn btn-primary navbar-cta">
          + Criar evento
        </Link>
      </div>
    </header>
  );
}
