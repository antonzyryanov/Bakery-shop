import { getOrderHistory, placeOrder } from '../services/orderService.js';

export const createOrder = async (req, res, next) => {
  try {
    const order = await placeOrder({
      customerId: req.user.sub,
      items: req.body.items,
      phoneNumber: req.body.phoneNumber,
      adress: req.body.adress
    });

    return res.status(201).json({ order });
  } catch (error) {
    return next(error);
  }
};

export const listMyOrders = async (req, res, next) => {
  try {
    const orders = await getOrderHistory(req.user.sub);
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
};
