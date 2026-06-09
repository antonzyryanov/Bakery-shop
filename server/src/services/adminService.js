import { getAdminStats } from '../repositories/statsRepository.js';

export const getStatistics = async () => getAdminStats();
