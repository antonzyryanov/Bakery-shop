import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, loginUser } from '../auth/authSlice.js';

const AdminAccessGate = ({ t, children }) => {
  const dispatch = useDispatch();
  const { user, loading: authLoading, error: authError, fieldErrors } = useSelector((state) => state.auth);
  const [credentials, setCredentials] = useState({ identifier: 'Admin', password: '' });
  const [adminLoginError, setAdminLoginError] = useState('');

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAdminLoginError('');
    dispatch(clearAuthError());

    const action = await dispatch(loginUser(credentials));
    if (action.error) {
      return;
    }

    if (action.payload?.role !== 'ADMIN') {
      setAdminLoginError(t('admin.loginRoleError'));
    }
  };

  if (user?.role === 'ADMIN') {
    return children;
  }

  const identifierError = (fieldErrors || []).find((item) => item.field === 'identifier' || item.field === 'email')?.message;
  const passwordError = (fieldErrors || []).find((item) => item.field === 'password')?.message;

  return (
    <section className="container admin-login-page">
      <div className="surface admin-login-panel">
        <span className="section-eyebrow">{t('admin.areaTitle')}</span>
        <h1>{t('admin.loginTitle')}</h1>
        <p>{t('admin.areaAuth')}</p>

        <form className="admin-form" onSubmit={handleAdminLogin}>
          <label>{t('admin.loginField')}</label>
          <input
            value={credentials.identifier}
            onChange={(event) => setCredentials({ ...credentials, identifier: event.target.value })}
            placeholder="Admin"
            required
          />
          {identifierError && <small className="error-text">{identifierError}</small>}

          <label>{t('admin.passwordField')}</label>
          <input
            value={credentials.password}
            onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
            type="password"
            required
          />
          {passwordError && <small className="error-text">{passwordError}</small>}

          {(adminLoginError || authError) && <p className="error-text">{adminLoginError || authError}</p>}

          <button className="checkout-btn" disabled={authLoading}>
            {authLoading ? t('auth.pleaseWait') : t('admin.loginButton')}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AdminAccessGate;