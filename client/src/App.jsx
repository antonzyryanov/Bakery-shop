import { useEffect, useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/Header.jsx';
import ProductCard from './components/ProductCard.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import AuthModal from './components/AuthModal.jsx';
import AdminPage from './features/admin/AdminPage.jsx';
import AdminOrdersPage from './features/admin/AdminOrdersPage.jsx';
import AdminProductsPage from './features/admin/AdminProductsPage.jsx';
import { fetchProducts } from './features/products/productsSlice.js';
import { decrementItem, incrementItem, placeOrder } from './features/cart/cartSlice.js';
import { clearAuthError, loadSession, loginUser, logoutUser, registerUser } from './features/auth/authSlice.js';
import { createTranslator, getInitialLocale, isSupportedLocale, localeStorageKey } from './localizations/index.js';
import './App.css';

const ShopPage = ({
  products,
  productsLoading,
  cartItems,
  onInc,
  onDec,
  t
}) => (
  <section className="container">
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
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

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
  };

  const handleAuthSubmit = async (payload) => {
    if (authMode === 'signin') {
      const action = await dispatch(loginUser(payload));
      if (!action.error) {
        setAuthOpen(false);
      }
      return;
    }

    const action = await dispatch(registerUser(payload));
    if (!action.error) {
      setAuthOpen(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setCartOpen(false);
      setAuthMode('signin');
      openAuth();
      return;
    }

    const action = await dispatch(placeOrder());
    if (!action.error) {
      setCartOpen(false);
      navigate('/');
    }
  };

  const handleLocaleChange = (nextLocale) => {
    if (!isSupportedLocale(nextLocale)) {
      return;
    }

    setLocale(nextLocale);
  };

  return (
    <div className="page-shell">
      <Header
        t={t}
        locale={locale}
        onLocaleChange={handleLocaleChange}
        onAuthOpen={openAuth}
        onCartOpen={() => setCartOpen(true)}
        onLogout={() => dispatch(logoutUser())}
        user={user}
        cartCount={cartCount}
      />

      <Routes>
        <Route path="/admin/orders" element={<AdminOrdersPage t={t} />} />
        <Route path="/admin/products" element={<AdminProductsPage t={t} />} />
        <Route
          path="/"
          element={
            <ShopPage
              products={products}
              productsLoading={productsLoading}
              cartItems={cartItems}
              onInc={(id) => dispatch(incrementItem(id))}
              onDec={(id) => dispatch(decrementItem(id))}
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
