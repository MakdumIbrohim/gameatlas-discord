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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(false);
  });

  it('returns plain text result when response is not JSON', async () => {
    mockedAxios.post.mockResolvedValueOnce(mockSuccessResponse);

    const result = await sendMessageToLangflow('Cari game gratis Steam', 'discord-123');
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.text).toBe('Ada beberapa game gratis di Steam sekarang!');
    }
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

  it('returns structured result when response is plain JSON with title field', async () => {
    const jsonResponse = {
      data: {
        outputs: [{ outputs: [{ results: { message: { text: JSON.stringify({ title: 'Test Game', platform: 'Steam', type: 'game' }) } } }] }],
      },
    };
    mockedAxios.post.mockResolvedValueOnce(jsonResponse);

    const result = await sendMessageToLangflow('Cari game gratis Steam', 'discord-123');
    expect(result.kind).toBe('structured');
    if (result.kind === 'structured') {
      expect(result.games[0]?.title).toBe('Test Game');
    }
  });

  it('returns structured result when Langflow uses "results" wrapper key', async () => {
    const games = [
      { title: 'Spooky Cats', platform: 'Steam', type: 'game', worth: '$2.99', claim_url: 'https://example.com' },
      { title: 'Another Game', platform: 'Steam', type: 'game', worth: '$9.99', claim_url: 'https://example.com/2' },
    ];
    const jsonResponse = {
      data: {
        outputs: [{ outputs: [{ results: { message: { text: JSON.stringify({ results: games }) } } }] }],
      },
    };
    mockedAxios.post.mockResolvedValueOnce(jsonResponse);

    const result = await sendMessageToLangflow('Cari 5 game gratis Steam', 'discord-123');
    expect(result.kind).toBe('structured');
    if (result.kind === 'structured') {
      expect(result.games).toHaveLength(2);
      expect(result.games[0]?.title).toBe('Spooky Cats');
    }
  });

  it('returns structured result when Langflow wraps JSON in markdown code block', async () => {
    const game = { title: 'Dwarven Realms', platform: 'PC, Steam', type: 'game', worth: '$9.99' };
    const wrappedJson = `\`\`\`json\n${JSON.stringify(game)}\n\`\`\``;
    const jsonResponse = {
      data: {
        outputs: [{ outputs: [{ results: { message: { text: wrappedJson } } }] }],
      },
    };
    mockedAxios.post.mockResolvedValueOnce(jsonResponse);

    const result = await sendMessageToLangflow('Cari game gratis Steam', 'discord-123');
    expect(result.kind).toBe('structured');
    if (result.kind === 'structured') {
      expect(result.games[0]?.title).toBe('Dwarven Realms');
      expect(result.games[0]?.worth).toBe('$9.99');
    }
  });

  it('throws LangflowError when response text is missing', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { outputs: [] }, status: 200 });

    await expect(sendMessageToLangflow('test', 'session-1')).rejects.toBeInstanceOf(LangflowError);
  });

  it('throws TimeoutError on ECONNABORTED', async () => {
    const timeoutErr = Object.assign(new Error('timeout'), { code: 'ECONNABORTED' });
    mockedAxios.post.mockRejectedValueOnce(timeoutErr);
    (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

    await expect(sendMessageToLangflow('test', 'session-1')).rejects.toBeInstanceOf(TimeoutError);
  });

  it('throws LangflowError on non-timeout Axios error', async () => {
    const axiosErr = Object.assign(new Error('Network Error'), {
      code: 'ERR_NETWORK',
      response: { status: 500 },
    });
    mockedAxios.post.mockRejectedValueOnce(axiosErr);
    (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

    await expect(sendMessageToLangflow('test', 'session-1')).rejects.toBeInstanceOf(LangflowError);
  });
});
