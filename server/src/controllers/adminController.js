import { getStatistics } from '../services/adminService.js';
import { createProductItem, deleteProductItem, updateProductItem } from '../services/productService.js';
import { acceptAdminOrder, getAdminOrders } from '../services/orderService.js';

export const stats = async (req, res, next) => {
  try {
    const data = await getStatistics();
    return res.json({ stats: data });
  } catch (error) {
    return next(error);
  }
};

export const addProduct = async (req, res, next) => {
  try {
    const product = await createProductItem(req.body);
    return res.status(201).json({ product });
  } catch (error) {
    return next(error);
  }
};

export const editProduct = async (req, res, next) => {
  try {
    const product = await updateProductItem({ id: req.params.id, ...req.body });
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
};

export const removeProduct = async (req, res, next) => {
  try {
    await deleteProductItem(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const listOrders = async (req, res, next) => {
  try {
    const range = String(req.query.range || 'last_month');
    const from = req.query.from ? String(req.query.from) : '';
    const to = req.query.to ? String(req.query.to) : '';
    const orders = await getAdminOrders({ range, from, to });
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
};

export const acceptOrder = async (req, res, next) => {
  try {
    const order = await acceptAdminOrder({ orderId: req.params.id });
    return res.json({ order });
  } catch (error) {
    return next(error);
  }
};

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('Image file is required.');
      error.status = 400;
      throw error;
    }

    return res.status(201).json({ imageUrl: `/uploads/products/${req.file.filename}` });
  } catch (error) {
    return next(error);
  }
};
