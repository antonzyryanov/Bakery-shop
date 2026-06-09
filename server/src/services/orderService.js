import { generateId } from '../utils/ids.js';
import { getProductById } from '../repositories/productRepository.js';
import {
  createOrderWithItems,
  getAdminOrdersByRange,
  getOrderHistoryByCustomer
} from '../repositories/orderRepository.js';
import { addDoneOrder, setCurrentOrderId } from '../repositories/customerRepository.js';

export const placeOrder = async ({ customerId, items, phoneNumber, adress }) => {
  if (!Array.isArray(items) || !items.length) {
    const error = new Error('At least one item is required.');
    error.status = 400;
    throw error;
  }

  const normalizedItems = [];
  let totalPrice = 0;

  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product) {
      const error = new Error(`Product not found: ${item.productId}`);
      error.status = 404;
      throw error;
    }

    const quantity = Number(item.quantity || 0);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      const error = new Error('Quantity must be a positive integer.');
      error.status = 400;
      throw error;
    }

    const linePrice = Number(product.price) * quantity;
    totalPrice += linePrice;

    normalizedItems.push({
      id: generateId(),
      productId: product.id,
      quantity,
      unitPrice: Number(product.price)
    });
  }

  const orderId = generateId();
  await createOrderWithItems({
    orderId,
    customerId,
    phoneNumber: String(phoneNumber || '').trim(),
    adress: String(adress || '').trim(),
    totalPrice: Number(totalPrice.toFixed(2)),
    items: normalizedItems
  });

  await setCurrentOrderId(customerId, orderId);
  await addDoneOrder(customerId, orderId);

  return {
    id: orderId,
    totalPrice: Number(totalPrice.toFixed(2)),
    items: normalizedItems
  };
};

export const getOrderHistory = async (customerId) => getOrderHistoryByCustomer(customerId);

export const getAdminOrders = async ({ range, from, to }) => getAdminOrdersByRange({ range, from, to });
