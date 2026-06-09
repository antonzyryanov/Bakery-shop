import { Link } from 'react-router-dom';

const Header = ({ onAuthOpen, onCartOpen, user, onLogout, cartCount, t, locale, onLocaleChange }) => (
  <header className="header surface">
    <div className="brand-wrap">
      <div className="brand-top-row">
        <img className="brand-logo" src="/images/top_logo.png" alt={t('header.logoAlt')} loading="eager" />
        <div className="brand-text-block">
          <h1>{t('header.title')}</h1>
        </div>
      </div>
      <p className="brand-tagline">{t('header.tagline')}</p>
    </div>

    <nav className="header-actions">
      <div className="lang-toggle" role="group" aria-label={t('header.languageSwitchLabel')}>
        <button
          className={`lang-btn ${locale === 'en' ? 'active' : ''}`}
          onClick={() => onLocaleChange('en')}
          type="button"
        >
          EN
        </button>
        <button
          className={`lang-btn ${locale === 'ru' ? 'active' : ''}`}
          onClick={() => onLocaleChange('ru')}
          type="button"
        >
          RU
        </button>
      </div>

      <Link to="/" className="text-link nav-link">{t('header.shop')}</Link>

      <button className="cart-pill" onClick={onCartOpen}>
        {t('header.cart')} <span>{cartCount}</span>
      </button>

      {user ? (
        <button className="ghost-btn" onClick={onLogout}>{t('header.signOut')}</button>
      ) : (
        <button className="ghost-btn" onClick={onAuthOpen}>{t('header.signInUp')}</button>
      )}
    </nav>
  </header>
);

export default Header;
