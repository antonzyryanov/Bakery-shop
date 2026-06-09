import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct
} from '../repositories/productRepository.js';
import { deleteCache, getCache, setCache } from './cacheService.js';
import { generateId } from '../utils/ids.js';

const PRODUCT_CACHE_KEY = 'products:all';

export const listProducts = async () => {
  const cached = await getCache(PRODUCT_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const products = await getAllProducts();
  await setCache(PRODUCT_CACHE_KEY, products, 120);
  return products;
};

export const createProductItem = async ({ name, description, imageUrl, price }) => {
  const id = generateId();
  await createProduct({ id, name, description, imageUrl, price });
  await deleteCache(PRODUCT_CACHE_KEY);
  return getProductById(id);
};

export const updateProductItem = async ({ id, name, description, imageUrl, price }) => {
  await updateProduct({ id, name, description, imageUrl, price });
  await deleteCache(PRODUCT_CACHE_KEY);
  return getProductById(id);
};

export const deleteProductItem = async (id) => {
  await deleteProduct(id);
  await deleteCache(PRODUCT_CACHE_KEY);
};
