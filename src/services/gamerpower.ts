import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { GamerPowerError, TimeoutError } from '../utils/errors';

export interface Giveaway {
  id: number;
  title: string;
  worth: string;
  thumbnail: string;
  image: string;
  description: string;
  instructions: string;
  open_giveaway_url: string;
  published_date: string;
  type: string;
  platforms: string;
  end_date: string;
  users: number;
  status: string;
  gamerpower_url: string;
  open_giveaway: string;
}

export async function getGiveaways(platform?: string): Promise<Giveaway[]> {
  const params: Record<string, string> = {};
  if (platform) {
    params['platform'] = platform.toLowerCase();
  }

  const url = `${config.gamerpower.apiUrl}/giveaways`;

  logger.info('Fetching giveaways from GamerPower', { platform, url });

  try {
    const response = await axios.get<Giveaway[]>(url, {
      params,
      timeout: 15_000,
    });

    if (!Array.isArray(response.data)) {
      logger.warn('GamerPower returned unexpected format');
      return [];
    }

    const active = response.data.filter((g) => g.status === 'Active');
    logger.info('Fetched giveaways', { count: active.length, platform });
    return active;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError;
      if (axiosErr.code === 'ECONNABORTED') {
        throw new TimeoutError('GamerPower request timed out');
      }
      throw new GamerPowerError(
        `GamerPower request failed: ${axiosErr.message}`,
        axiosErr.response?.status,
      );
    }
    throw err;
  }
}
