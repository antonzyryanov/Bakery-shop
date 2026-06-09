import { listProducts } from '../services/productService.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await listProducts();
    return res.json({ products });
  } catch (error) {
    return next(error);
  }
};
