import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createNutritionEntry,
  getNutritionStats,
  listNutritionEntries
} from '../services/nutritionService.js';
import { syncNutritionUser } from '../services/nutritionClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nutritionUploadDir = path.resolve(__dirname, '../../uploads/nutrition');

export const listEntries = async (req, res, next) => {
  try {
    const range = String(req.query.range || 'last_month');
    const from = req.query.from ? String(req.query.from) : '';
    const to = req.query.to ? String(req.query.to) : '';
    const entries = await listNutritionEntries({
      userId: req.user.sub,
      range,
      from,
      to
    });
    return res.json({ entries });
  } catch (error) {
    return next(error);
  }
};

export const createEntry = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('Dish photo is required.');
      error.status = 400;
      throw error;
    }

    const {
      dishName,
      calories,
      proteins,
      fats,
      carbohydrates,
      description,
      eatenAt
    } = req.body;

    if (!dishName?.trim() || !description?.trim()) {
      const error = new Error('All fields are required.');
      error.status = 400;
      throw error;
    }

    const imageUrl = `/uploads/nutrition/${req.file.filename}`;
    const entry = await createNutritionEntry({
      userId: req.user.sub,
      payload: {
        dish_name: dishName.trim(),
        image_url: imageUrl,
        calories: Number(calories),
        proteins: Number(proteins),
        fats: Number(fats),
        carbohydrates: Number(carbohydrates),
        description: description.trim(),
        eaten_at: eatenAt || undefined
      }
    });

    return res.status(201).json({ entry });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    return next(error);
  }
};

export const stats = async (req, res, next) => {
  try {
    const range = String(req.query.range || 'last_month');
    const from = req.query.from ? String(req.query.from) : '';
    const to = req.query.to ? String(req.query.to) : '';
    const data = await getNutritionStats({
      userId: req.user.sub,
      range,
      from,
      to
    });
    return res.json({ stats: data });
  } catch (error) {
    return next(error);
  }
};

export const ensureNutritionUser = async (req, res, next) => {
  try {
    await syncNutritionUser({
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role
    });
    return next();
  } catch (error) {
    return next(error);
  }
};

export const nutritionUploadDirPath = nutritionUploadDir;
