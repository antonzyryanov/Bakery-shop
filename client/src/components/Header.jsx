import { Link } from 'react-router-dom';

const BrandTitle = ({ title }) => {
  const words = String(title || '').trim().split(/\s+/).filter(Boolean);

  return (
    <Link className="brand-title-link" to="/">
      {words.map((word) => (
        <span className="brand-title-word" key={word}>{word}</span>
      ))}
    </Link>
  );
};

const Header = ({ onAuthOpen, onCartOpen, user, onLogout, cartCount, t, locale, onLocaleChange }) => (
  <header className="header surface">
    <div className="brand-wrap">
      <div className="brand-top-row">
        <Link className="brand-logo-link" to="/" aria-label={t('header.toMain')}>
          <img className="brand-logo" src="/images/top_logo.png" alt={t('header.logoAlt')} loading="eager" />
        </Link>
        <div className="brand-text-block">
          <h1>
            <BrandTitle title={t('header.title')} />
          </h1>
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

      <Link className="ghost-btn nav-link" to="/">{t('header.toMain')}</Link>

      <button className="cart-pill" onClick={onCartOpen} type="button">
        {t('header.cart')} <span>{cartCount}</span>
      </button>

      {user ? (
        <>
          {user.role !== 'ADMIN' && (
            <Link className="accent-nav-btn nav-link" to="/orders">{t('header.orders')}</Link>
          )}
          {user.role !== 'ADMIN' && (
            <Link className="accent-nav-btn nav-link" to="/nutrition">{t('header.nutrition')}</Link>
          )}
          <button className="ghost-btn" onClick={onLogout} type="button">{t('header.signOut')}</button>
        </>
      ) : (
        <button className="ghost-btn" onClick={onAuthOpen} type="button">{t('header.signInUp')}</button>
      )}
    </nav>
  </header>
);

export default Header;
