import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
  StatusBar,
  Alert
} from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { store } from './src/store';
import { colors, radii, spacing } from './src/theme';
import { createTranslator, isSupportedLocale } from './src/i18n';
import { fetchProducts } from './src/features/productsSlice';
import {
  clearAuthError,
  loadSession,
  loginUser,
  logoutUser,
  registerUser
} from './src/features/authSlice';
import {
  decrementItem,
  incrementItem,
  placeOrder
} from './src/features/cartSlice';
import { trackActivity } from './src/activityLogger';
import { API_BASE_URL } from './src/config';
import ProductCard from './src/components/ProductCard';
import AuthModal from './src/components/AuthModal';
import CartModal from './src/components/CartModal';
import CartIcon from './src/components/CartIcon';
import OrdersModal from './src/components/OrdersModal';

const ShopApp = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = width >= 1100 ? 4 : width >= 768 ? 3 : 2;
  const horizontalPad = isTablet ? 28 : 16;
  const gap = isTablet ? 18 : 12;
  const cardWidth = (width - horizontalPad * 2 - gap * (numColumns - 1)) / numColumns;
  const cartBottom = Math.max(insets.bottom, 12) + 12;

  const [locale, setLocale] = useState('en');
  const t = useMemo(() => createTranslator(locale), [locale]);
  const { items: products, loading: productsLoading, error: productsError } = useSelector((state) => state.products);
  const { items: cartItems, placing, error: orderError } = useSelector((state) => state.cart);
  const { user, loading: authLoading, error: authError } = useSelector((state) => state.auth);

  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [ordersOpen, setOrdersOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(loadSession());
    trackActivity('APP_OPEN', { page: 'HOME' });
    trackActivity('PAGE_VIEW', { page: 'HOME' });
  }, [dispatch]);

  const productsById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products]
  );

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((sum, qty) => sum + qty, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => Object.entries(cartItems).reduce((sum, [id, qty]) => {
      const product = productsById[id];
      return product ? sum + Number(product.price) * qty : sum;
    }, 0),
    [cartItems, productsById]
  );

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
        trackActivity('AUTH_LOGIN_FAIL', {
          page: 'AUTH',
          meta: { reason: action.error.message || 'unknown' }
        });
      }
      return;
    }

    const action = await dispatch(registerUser(payload));
    if (!action.error) {
      trackActivity('AUTH_REGISTER_SUCCESS', { page: 'AUTH' });
      setAuthOpen(false);
    }
  };

  const handleCheckout = async ({ phoneNumber, adress }) => {
    trackActivity('ORDER_PLACE_CLICK', { page: 'CHECKOUT' });

    if (!user) {
      setCartOpen(false);
      setAuthMode('signin');
      openAuth();
      return;
    }

    const action = await dispatch(placeOrder({ phoneNumber, adress }));
    if (!action.error) {
      trackActivity('ORDER_PLACED', {
        page: 'CHECKOUT',
        orderId: action.payload?.id || null
      });
      setCartOpen(false);
      Alert.alert(t('title'), t('orderSuccess'));
    } else {
      trackActivity('ORDER_FAILED', {
        page: 'CHECKOUT',
        meta: { reason: action.error.message || 'unknown' }
      });
    }
  };

  const changeLocale = (nextLocale) => {
    if (!isSupportedLocale(nextLocale) || nextLocale === locale) {
      return;
    }

    trackActivity('LOCALE_CHANGE', {
      page: 'HOME',
      meta: { from: locale, to: nextLocale }
    });
    setLocale(nextLocale);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.cream, '#ffffff', '#f7f4ef']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        <View style={[styles.topBar, { paddingHorizontal: horizontalPad }]}>
          <View style={styles.langToggle}>
            <Pressable
              style={[styles.langBtn, locale === 'en' && styles.langBtnActive]}
              onPress={() => changeLocale('en')}
            >
              <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>EN</Text>
            </Pressable>
            <Pressable
              style={[styles.langBtn, locale === 'ru' && styles.langBtnActive]}
              onPress={() => changeLocale('ru')}
            >
              <Text style={[styles.langText, locale === 'ru' && styles.langTextActive]}>RU</Text>
            </Pressable>
          </View>

          {user ? (
            <View style={styles.authRow}>
              {user.role !== 'ADMIN' ? (
                <Pressable style={styles.authChip} onPress={() => setOrdersOpen(true)}>
                  <Text style={styles.authChipText}>{t('orders')}</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={styles.authChip}
                onPress={() => {
                  trackActivity('AUTH_LOGOUT', { page: 'HOME' });
                  dispatch(logoutUser());
                }}
              >
                <Text style={styles.authChipText}>{t('signOut')}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.authChip} onPress={openAuth}>
              <Text style={styles.authChipText}>{t('signInUp')}</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.brandBlock, { paddingHorizontal: horizontalPad }]}>
          <Text style={[styles.brandTitle, isTablet && styles.brandTitleTablet]} numberOfLines={1}>
            {t('title')}
          </Text>
          <Text style={[styles.tagline, isTablet && styles.taglineTablet]}>{t('tagline')}</Text>
        </View>

        {productsLoading ? (
          <Text style={styles.loading}>{t('loading')}</Text>
        ) : productsError ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{productsError}</Text>
            <Text style={styles.errorHint}>API: {API_BASE_URL}</Text>
            <Text style={styles.errorHint}>
              Use the same Wi‑Fi/LAN as your PC. Backend must listen on port 4000.
            </Text>
          </View>
        ) : (
          <FlatList
            key={`cols-${numColumns}`}
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={{
              paddingHorizontal: horizontalPad,
              paddingBottom: cartBottom + 80,
              paddingTop: 8
            }}
            columnWrapperStyle={numColumns > 1 ? { gap } : undefined}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                quantity={cartItems[item.id] || 0}
                cardWidth={cardWidth}
                onIncrement={() => {
                  trackActivity('PRODUCT_ADD', { page: 'HOME', productId: item.id });
                  dispatch(incrementItem(item.id));
                }}
                onDecrement={() => {
                  trackActivity('PRODUCT_REMOVE', { page: 'HOME', productId: item.id });
                  dispatch(decrementItem(item.id));
                }}
              />
            )}
          />
        )}

        <Pressable
          style={[styles.cartFab, { bottom: cartBottom }]}
          onPress={() => {
            setCartOpen(true);
            trackActivity('CART_OPEN', { page: 'CART' });
          }}
        >
          <CartIcon color={colors.black900} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          )}
        </Pressable>

        <CartModal
          visible={cartOpen}
          onClose={() => setCartOpen(false)}
          items={cartItems}
          productsById={productsById}
          total={cartTotal}
          onCheckout={handleCheckout}
          placing={placing}
          error={orderError}
          t={t}
        />

        <AuthModal
          visible={authOpen}
          onClose={() => setAuthOpen(false)}
          mode={authMode}
          setMode={setAuthMode}
          onSubmit={handleAuthSubmit}
          loading={authLoading}
          error={authError}
          t={t}
        />

        <OrdersModal
          visible={ordersOpen}
          onClose={() => setOrdersOpen(false)}
          t={t}
        />
      </SafeAreaView>
    </View>
  );
};

const App = () => (
  <Provider store={store}>
    <SafeAreaProvider>
      <ShopApp />
    </SafeAreaProvider>
  </Provider>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream
  },
  flex: {
    flex: 1
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    marginBottom: spacing.sm
  },
  brandBlock: {
    marginBottom: spacing.md,
    gap: 6
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.black900,
    letterSpacing: -0.4
  },
  brandTitleTablet: {
    fontSize: 40
  },
  tagline: {
    color: colors.black700,
    fontWeight: '600',
    lineHeight: 21,
    fontSize: 14,
    maxWidth: 340
  },
  taglineTablet: {
    fontSize: 16,
    maxWidth: 520
  },
  langToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)'
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  langBtnActive: {
    backgroundColor: colors.black900
  },
  langText: {
    fontWeight: '800',
    color: colors.black700
  },
  langTextActive: {
    color: colors.white
  },
  authChip: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.gray300
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  authChipText: {
    fontWeight: '800',
    color: colors.black700,
    fontSize: 13
  },
  cartFab: {
    position: 'absolute',
    right: 18,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.orange500,
    borderWidth: 2,
    borderColor: colors.black900,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    zIndex: 20
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.black900,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5
  },
  cartBadgeText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 11
  },
  loading: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.gray500,
    fontWeight: '700'
  },
  error: {
    textAlign: 'center',
    color: colors.danger,
    fontWeight: '700',
    paddingHorizontal: 24
  },
  errorBox: {
    marginTop: 40,
    paddingHorizontal: 24,
    gap: 8
  },
  errorHint: {
    textAlign: 'center',
    color: colors.gray500,
    fontWeight: '600',
    lineHeight: 20
  }
});

export default App;
