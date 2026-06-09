import { getProfile, loginCustomer, registerCustomer } from '../services/authService.js';

const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
  maxAge: 1000 * 60 * 60 * 24
};

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await registerCustomer({ email, password });
    res.cookie('access_token', result.token, authCookieOptions);
    return res.status(201).json({ user: result.user });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const result = await loginCustomer({ identifier, password });
    res.cookie('access_token', result.token, authCookieOptions);
    return res.json({ user: result.user });
  } catch (error) {
    return next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie('access_token');
  return res.status(204).send();
};

export const profile = async (req, res, next) => {
  try {
    const customer = await getProfile(req.user.sub);
    return res.json({ user: customer });
  } catch (error) {
    return next(error);
  }
};
