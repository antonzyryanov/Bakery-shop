import { generateId } from '../utils/ids.js';
import { getProductById } from '../repositories/productRepository.js';
import {
  createOrderWithItems,
  getAdminOrdersByRange,
  getOrderById,
  getOrderHistoryByCustomer,
  updateOrderStatus
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
    status: 'PLACED',
    items: normalizedItems
  };
};

export const getOrderHistory = async (customerId) => getOrderHistoryByCustomer(customerId);

export const getAdminOrders = async ({ range, from, to }) => getAdminOrdersByRange({ range, from, to });

export const cancelCustomerOrder = async ({ orderId, customerId }) => {
  const order = await getOrderById(orderId);
  if (!order) {
    const error = new Error('Order not found.');
    error.status = 404;
    throw error;
  }

  if (order.customerId !== customerId) {
    const error = new Error('You can only cancel your own orders.');
    error.status = 403;
    throw error;
  }

  if (order.status !== 'PLACED') {
    const error = new Error('Only orders that are not accepted yet can be cancelled.');
    error.status = 400;
    throw error;
  }

  const updated = await updateOrderStatus({
    orderId,
    status: 'CANCELLED',
    expectedStatus: 'PLACED'
  });

  if (!updated) {
    const error = new Error('Order could not be cancelled. It may have been accepted already.');
    error.status = 409;
    throw error;
  }

  return { id: orderId, status: 'CANCELLED' };
};

export const acceptAdminOrder = async ({ orderId }) => {
  const order = await getOrderById(orderId);
  if (!order) {
    const error = new Error('Order not found.');
    error.status = 404;
    throw error;
  }

  if (order.status !== 'PLACED') {
    const error = new Error('Only placed orders can be accepted.');
    error.status = 400;
    throw error;
  }

  const updated = await updateOrderStatus({
    orderId,
    status: 'ACCEPTED',
    expectedStatus: 'PLACED'
  });

  if (!updated) {
    const error = new Error('Order could not be accepted.');
    error.status = 409;
    throw error;
  }

  return { id: orderId, status: 'ACCEPTED' };
};
