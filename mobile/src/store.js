import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './features/productsSlice';
import authReducer from './features/authSlice';
import cartReducer from './features/cartSlice';
import customerOrdersReducer from './features/customerOrdersSlice';
import nutritionReducer from './features/nutritionSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    auth: authReducer,
    cart: cartReducer,
    customerOrders: customerOrdersReducer,
    nutrition: nutritionReducer
  }
});
