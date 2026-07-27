import { configureStore } from '@reduxjs/toolkit';
import productsReducer from '../features/products/productsSlice.js';
import authReducer from '../features/auth/authSlice.js';
import cartReducer from '../features/cart/cartSlice.js';
import adminReducer from '../features/admin/adminSlice.js';
import metricsReducer from '../features/metrics/metricsSlice.js';
import customerOrdersReducer from '../features/orders/customerOrdersSlice.js';
import nutritionReducer from '../features/nutrition/nutritionSlice.js';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    auth: authReducer,
    cart: cartReducer,
    admin: adminReducer,
    metrics: metricsReducer,
    customerOrders: customerOrdersReducer,
    nutrition: nutritionReducer
  }
});
