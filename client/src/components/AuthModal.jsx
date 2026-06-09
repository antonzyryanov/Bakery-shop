import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react';

const AuthModal = ({ open, onClose, mode, setMode, onSubmit, loading, error, fieldErrors, t }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const errorMap = useMemo(() => {
    const map = {};
    for (const item of fieldErrors || []) {
      map[item.field] = item.message;
    }
    return map;
  }, [fieldErrors]);

  if (!open) {
    return null;
  }

  const submit = (event) => {
    event.preventDefault();
    if (mode === 'signin') {
      onSubmit({ identifier, password });
      return;
    }

    onSubmit({ email: identifier, password });
  };

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="auth-modal surface" onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>{mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}</h2>
          <button className="icon-btn" onClick={onClose}>x</button>
        </header>

        <form onSubmit={submit}>
          <label>{mode === 'signin' ? t('auth.emailOrLogin') : t('auth.email')}</label>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            type={mode === 'signin' ? 'text' : 'email'}
            placeholder={mode === 'signin' ? t('auth.signInPlaceholder') : t('auth.signUpPlaceholder')}
            required
          />
          {errorMap.email && <small className="error-text">{errorMap.email}</small>}
          {errorMap.identifier && <small className="error-text">{errorMap.identifier}</small>}

          <label>{t('auth.password')}</label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            required
          />
          {errorMap.password && <small className="error-text">{errorMap.password}</small>}

          {error && <p className="error-text">{error}</p>}

          <button className="checkout-btn" disabled={loading}>
            {loading ? t('auth.pleaseWait') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </form>

        <button className="text-link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? t('auth.needAccount') : t('auth.haveAccount')}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
