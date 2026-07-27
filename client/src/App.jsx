import { useEffect, useMemo, useRef, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/Header.jsx';
import ProductCard from './components/ProductCard.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import AuthModal from './components/AuthModal.jsx';
import AdminPage from './features/admin/AdminPage.jsx';
import AdminOrdersPage from './features/admin/AdminOrdersPage.jsx';
import AdminProductsPage from './features/admin/AdminProductsPage.jsx';
import AdminMetricsPage from './features/admin/AdminMetricsPage.jsx';
import AdminMessagesPage from './features/admin/AdminMessagesPage.jsx';
import CustomerOrdersPage from './features/orders/CustomerOrdersPage.jsx';
import { fetchProducts } from './features/products/productsSlice.js';
import { decrementItem, incrementItem, placeOrder } from './features/cart/cartSlice.js';
import { clearAuthError, loadSession, loginUser, logoutUser, registerUser } from './features/auth/authSlice.js';
import { trackActivity } from './features/metrics/activityLogger.js';
import { createTranslator, getInitialLocale, isSupportedLocale, localeStorageKey } from './localizations/index.js';
import './App.css';

const PAGE_ENTER_MS = 600;
const LOCALE_FADE_OUT_MS = 280;
const LOCALE_FADE_IN_MS = 520;

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

const ShopPage = ({
  products,
  productsLoading,
  cartItems,
  onInc,
  onDec,
  t
}) => (
  <section className="container shop-container">
    {productsLoading ? (
      <section className="loading-block surface">{t('app.loadingProducts')}</section>
    ) : (
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={cartItems[product.id] || 0}
            onIncrement={() => onInc(product.id)}
            onDecrement={() => onDec(product.id)}
          />
        ))}
      </div>
    )}
  </section>
);

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [locale, setLocale] = useState(getInitialLocale);
  const [localePhase, setLocalePhase] = useState('idle');
  const [isPageEntering, setIsPageEntering] = useState(() => !prefersReducedMotion());
  const pendingLocaleRef = useRef(null);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const { items: products, loading: productsLoading } = useSelector((state) => state.products);
  const { items: cartItems, placing, error: orderError } = useSelector((state) => state.cart);
  const { user, loading: authLoading, error: authError, fieldErrors } = useSelector((state) => state.auth);

  const [isCartOpen, setCartOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(loadSession());
    trackActivity('APP_OPEN', { page: 'HOME' });
    trackActivity('PAGE_VIEW', { page: 'HOME' });
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

  useEffect(() => {
    if (!isPageEntering) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setIsPageEntering(false);
    }, PAGE_ENTER_MS);

    return () => window.clearTimeout(timerId);
  }, [isPageEntering]);

  useEffect(() => {
    if (localePhase !== 'out') {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      const nextLocale = pendingLocaleRef.current;
      if (nextLocale) {
        setLocale(nextLocale);
        pendingLocaleRef.current = null;
      }
      setLocalePhase('in');
    }, LOCALE_FADE_OUT_MS);

    return () => window.clearTimeout(timerId);
  }, [localePhase]);

  useEffect(() => {
    if (localePhase !== 'in') {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setLocalePhase('idle');
    }, LOCALE_FADE_IN_MS);

    return () => window.clearTimeout(timerId);
  }, [localePhase]);

  const productsById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products]
  );

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((sum, qty) => sum + qty, 0),
    [cartItems]
  );

  const cartTotal = useMemo(() => {
    return Object.entries(cartItems).reduce((sum, [id, qty]) => {
      const product = productsById[id];
      if (!product) {
        return sum;
      }
      return sum + Number(product.price) * qty;
    }, 0);
  }, [cartItems, productsById]);

  const openAuth = () => {
    dispatch(clearAuthError());
    setAuthOpen(true);
    trackActivity('AUTH_OPEN', { page: 'AUTH' });
  };

  const handleAuthSubmit = async (payload) => {
    if (authMode === 'signin') {
      const action = await dispatch(loginUser(payload));
      if (!action.error) {
        trackActivity('AUTH_LOGIN_SUCCESS', { page: 'AUTH' });
        setAuthOpen(false);
      } else {
        trackActivity('AUTH_LOGIN_FAIL', { page: 'AUTH', meta: { reason: action.error.message || 'unknown' } });
      }
      return;
    }

    const action = await dispatch(registerUser(payload));
    if (!action.error) {
      trackActivity('AUTH_REGISTER_SUCCESS', { page: 'AUTH' });
      setAuthOpen(false);
    }
  };

  const handleCheckout = async () => {
    trackActivity('ORDER_PLACE_CLICK', { page: 'CHECKOUT' });
    if (!user) {
      setCartOpen(false);
      setAuthMode('signin');
      openAuth();
      return;
    }

    const action = await dispatch(placeOrder());
    if (!action.error) {
      trackActivity('ORDER_PLACED', {
        page: 'CHECKOUT',
        orderId: action.payload?.id || null
      });
      setCartOpen(false);
      navigate('/');
    } else {
      trackActivity('ORDER_FAILED', {
        page: 'CHECKOUT',
        meta: { reason: action.error.message || 'unknown' }
      });
    }
  };

  const handleLocaleChange = (nextLocale) => {
    if (!isSupportedLocale(nextLocale) || nextLocale === locale || localePhase !== 'idle') {
      return;
    }

    trackActivity('LOCALE_CHANGE', {
      page: 'HOME',
      meta: { from: locale, to: nextLocale }
    });

    if (prefersReducedMotion()) {
      setLocale(nextLocale);
      return;
    }

    pendingLocaleRef.current = nextLocale;
    setLocalePhase('out');
  };

  const pageShellClassName = [
    'page-shell',
    isPageEntering ? 'is-page-enter' : '',
    localePhase === 'out' ? 'is-locale-out' : '',
    localePhase === 'in' ? 'is-locale-in' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={pageShellClassName}>
      <Header
        t={t}
        locale={locale}
        onLocaleChange={handleLocaleChange}
        onAuthOpen={openAuth}
        onCartOpen={() => {
          setCartOpen(true);
          trackActivity('CART_OPEN', { page: 'CART' });
        }}
        onLogout={() => {
          trackActivity('AUTH_LOGOUT', { page: 'HOME' });
          dispatch(logoutUser());
        }}
        user={user}
        cartCount={cartCount}
      />

      <Routes>
        <Route path="/orders" element={<CustomerOrdersPage t={t} />} />
        <Route path="/admin/orders" element={<AdminOrdersPage t={t} />} />
        <Route path="/admin/products" element={<AdminProductsPage t={t} />} />
        <Route path="/admin/metrics" element={<AdminMetricsPage t={t} />} />
        <Route path="/admin/messages" element={<AdminMessagesPage t={t} />} />
        <Route
          path="/"
          element={
            <ShopPage
              products={products}
              productsLoading={productsLoading}
              cartItems={cartItems}
              onInc={(id) => {
                trackActivity('PRODUCT_ADD', { page: 'HOME', productId: id });
                dispatch(incrementItem(id));
              }}
              onDec={(id) => {
                trackActivity('PRODUCT_REMOVE', { page: 'HOME', productId: id });
                dispatch(decrementItem(id));
              }}
              t={t}
            />
          }
        />
        <Route path="/admin" element={<AdminPage t={t} />} />
      </Routes>

      <CartDrawer
        t={t}
        open={isCartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        productsById={productsById}
        total={cartTotal}
        onCheckout={handleCheckout}
        placing={placing}
        error={orderError}
      />

      <AuthModal
        t={t}
        open={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        setMode={setAuthMode}
        onSubmit={handleAuthSubmit}
        loading={authLoading}
        error={authError}
        fieldErrors={fieldErrors}
      />
    </div>
  );
};

export default App;
