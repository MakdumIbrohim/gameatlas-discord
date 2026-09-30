import axios from 'axios';
import { sendMessageToLangflow } from '../src/services/langflow';
import { LangflowError, TimeoutError } from '../src/utils/errors';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Suppress config validation errors during tests
jest.mock('../src/config', () => ({
  config: {
    langflow: {
      serverUrl: 'http://localhost:7860',
      apiKey: 'test-key',
      flowId: 'test-flow-id',
      timeoutMs: 5000,
    },
    discord: { token: 'test', clientId: 'test', guildId: undefined },
    gamerpower: { apiUrl: 'https://www.gamerpower.com/api' },
  },
}));

const mockSuccessResponse = {
  data: {
    outputs: [
      {
        outputs: [
          {
            results: {
              message: {
                text: 'Ada beberapa game gratis di Steam sekarang!',
              },
            },
          },
        ],
      },
    ],
  },
  status: 200,
};

describe('sendMessageToLangflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);
  });

  it('returns the AI text on success', async () => {
    mockedAxios.post.mockResolvedValueOnce(mockSuccessResponse);

    const result = await sendMessageToLangflow('Cari game gratis Steam', 'discord-123');
    expect(result).toBe('Ada beberapa game gratis di Steam sekarang!');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:7860/api/v1/run/test-flow-id',
      expect.objectContaining({
        input_value: 'Cari game gratis Steam',
        session_id: 'discord-123',
      }),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'test-key' }),
      }),
    );
  });

  it('throws LangflowError when response text is missing', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { outputs: [] }, status: 200 });

    await expect(sendMessageToLangflow('test', 'session-1')).rejects.toBeInstanceOf(LangflowError);
  });

  it('throws TimeoutError on ECONNABORTED', async () => {
    const timeoutErr = Object.assign(new Error('timeout'), { code: 'ECONNABORTED' });
    mockedAxios.post.mockRejectedValueOnce(timeoutErr);
    mockedAxios.isAxiosError.mockReturnValue(true);

    await expect(sendMessageToLangflow('test', 'session-1')).rejects.toBeInstanceOf(TimeoutError);
  });

  it('throws LangflowError on non-timeout Axios error', async () => {
    const axiosErr = Object.assign(new Error('Network Error'), {
      code: 'ERR_NETWORK',
      response: { status: 500 },
    });
    mockedAxios.post.mockRejectedValueOnce(axiosErr);
    mockedAxios.isAxiosError.mockReturnValue(true);

    await expect(sendMessageToLangflow('test', 'session-1')).rejects.toBeInstanceOf(LangflowError);
  });
});
