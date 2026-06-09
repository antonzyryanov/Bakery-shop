import bcrypt from 'bcryptjs';
import { generateId } from '../utils/ids.js';
import { signAccessToken } from '../utils/jwt.js';
import {
  createCustomer,
  ensureAdminUser,
  findCustomerByEmail,
  findCustomerById
} from '../repositories/customerRepository.js';
import { env } from '../config/env.js';

export const bootstrapAdmin = async () => {
  const hash = await bcrypt.hash(env.adminPassword, 10);
  await ensureAdminUser({ email: env.adminEmail, passwordHash: hash });
};

export const registerCustomer = async ({ email, password }) => {
  const existing = await findCustomerByEmail(email);
  if (existing) {
    const error = new Error('Email already in use.');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const customerId = generateId();

  await createCustomer({ id: customerId, email, passwordHash });

  return {
    token: signAccessToken({ sub: customerId, email, role: 'CUSTOMER' }),
    user: { id: customerId, email, role: 'CUSTOMER' }
  };
};

export const loginCustomer = async ({ identifier, password }) => {
  const email = identifier === 'Admin' ? env.adminEmail : identifier;
  const customer = await findCustomerByEmail(email);
  if (!customer) {
    const error = new Error('Invalid credentials.');
    error.status = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, customer.password_hash);
  if (!valid) {
    const error = new Error('Invalid credentials.');
    error.status = 401;
    throw error;
  }

  return {
    token: signAccessToken({ sub: customer.id, email: customer.email, role: customer.role }),
    user: {
      id: customer.id,
      email: customer.email,
      role: customer.role,
      currentOrderId: customer.current_order_id || null
    }
  };
};

export const getProfile = async (customerId) => {
  const customer = await findCustomerById(customerId);
  if (!customer) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  return customer;
};
