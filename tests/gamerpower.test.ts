import axios from 'axios';
import { getGiveaways, Giveaway } from '../src/services/gamerpower';
import { GamerPowerError, TimeoutError } from '../src/utils/errors';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../src/config', () => ({
  config: {
    gamerpower: { apiUrl: 'https://www.gamerpower.com/api' },
    langflow: { serverUrl: '', apiKey: '', flowId: '', timeoutMs: 5000 },
    discord: { token: '', clientId: '', guildId: undefined },
  },
}));

const mockGiveaways: Giveaway[] = [
  {
    id: 1,
    title: 'Test Game 1',
    worth: '$9.99',
    thumbnail: '',
    image: '',
    description: 'A free game',
    instructions: '',
    open_giveaway_url: 'https://www.gamerpower.com/open/test-game-1',
    published_date: '2024-01-01',
    type: 'Game',
    platforms: 'Steam',
    end_date: '2099-12-31 00:00:00',
    users: 100,
    status: 'Active',
    gamerpower_url: 'https://www.gamerpower.com/test-game-1',
    open_giveaway: 'https://store.steampowered.com/test',
  },
  {
    id: 2,
    title: 'Expired Game',
    worth: '$4.99',
    thumbnail: '',
    image: '',
    description: 'Expired',
    instructions: '',
    open_giveaway_url: '',
    published_date: '2024-01-01',
    type: 'Game',
    platforms: 'Epic Games Store',
    end_date: '2020-01-01 00:00:00',
    users: 50,
    status: 'Expired',
    gamerpower_url: '',
    open_giveaway: '',
  },
];

describe('getGiveaways', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(false);
  });

  it('returns only active giveaways', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockGiveaways });

    const result = await getGiveaways();
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Test Game 1');
  });

  it('passes platform param when provided', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [mockGiveaways[0]] });

    await getGiveaways('steam');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.gamerpower.com/api/giveaways',
      expect.objectContaining({ params: { platform: 'steam' } }),
    );
  });

  it('returns empty array when response is not an array', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { status: 0 } });

    const result = await getGiveaways();
    expect(result).toEqual([]);
  });

  it('throws TimeoutError on ECONNABORTED', async () => {
    const timeoutErr = Object.assign(new Error('timeout'), { code: 'ECONNABORTED' });
    mockedAxios.get.mockRejectedValueOnce(timeoutErr);
    (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

    await expect(getGiveaways()).rejects.toBeInstanceOf(TimeoutError);
  });

  it('throws GamerPowerError on non-timeout Axios error', async () => {
    const axiosErr = Object.assign(new Error('Network Error'), {
      code: 'ERR_NETWORK',
      response: { status: 503 },
    });
    mockedAxios.get.mockRejectedValueOnce(axiosErr);
    (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

    await expect(getGiveaways()).rejects.toBeInstanceOf(GamerPowerError);
  });
});
