import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

const LINKS = [
  { to: '/', label: 'Explorar', end: true },
  { to: '/meus-ingressos', label: 'Meus ingressos' },
  { to: '/painel', label: 'Painel' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');
  const drawerLinkClass = ({ isActive }) => (isActive ? 'drawer-link active' : 'drawer-link');

  return (
    <header className={scrolled ? 'navbar scrolled' : 'navbar'}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="navbar-logo-badge">
            <span className="navbar-logo-icon">🎟️</span>
          </span>
          <span className="navbar-logo-text">
            Ticket<span className="text-gradient">eira</span>
          </span>
        </Link>

        <nav className="navbar-links" aria-label="Navegação principal">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions">
          <Link to="/criar" className="btn btn-primary navbar-cta">
            <span className="navbar-cta-plus">+</span> Criar evento
          </Link>

          <button
            type="button"
            className={menuOpen ? 'navbar-burger open' : 'navbar-burger'}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="navbar-burger-line" />
            <span className="navbar-burger-line" />
            <span className="navbar-burger-line" />
          </button>
        </div>
      </div>

      <div className={menuOpen ? 'drawer open' : 'drawer'} aria-hidden={!menuOpen}>
        <nav className="drawer-links" aria-label="Menu">
          {LINKS.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={drawerLinkClass}
              style={{ transitionDelay: menuOpen ? `${0.08 + i * 0.07}s` : '0s' }}
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
            >
              <span className="drawer-link-index">0{i + 1}</span>
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/criar"
            className="btn btn-primary drawer-cta"
            style={{ transitionDelay: menuOpen ? `${0.08 + LINKS.length * 0.07}s` : '0s' }}
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="navbar-cta-plus">+</span> Criar evento
          </Link>
        </nav>
        <p
          className="drawer-footer"
          style={{ transitionDelay: menuOpen ? `${0.16 + LINKS.length * 0.07}s` : '0s' }}
        >
          Sua noite começa aqui 🎶
        </p>
      </div>
    </header>
  );
}
