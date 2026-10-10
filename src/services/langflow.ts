import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { LangflowError, TimeoutError } from '../utils/errors';

export interface LangflowResponse {
  outputs: Array<{
    outputs: Array<{
      results: {
        message: {
          text: string;
        };
      };
    }>;
  }>;
}

// Structured game data dari Langflow Structured Output
export interface LangflowGameResult {
  title: string;
  platform: string;
  type: string;
  description?: string;
  worth?: string;
  end_date?: string;
  image_url?: string;
  claim_url?: string;
  open_giveaway_url?: string;
  genre?: string;
  system_requirements?: string;
  reason?: string;
}

export type LangflowResult =
  | { kind: 'structured'; games: LangflowGameResult[] }
  | { kind: 'text'; text: string };

function extractJson(text: string): string {
  const trimmed = text.trim();

  // Strip markdown code block: ```json ... ``` atau ``` ... ```
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1].trim();
  }

  return trimmed;
}

function extractGamesFromParsed(parsed: unknown): LangflowGameResult[] | null {
  if (!parsed || typeof parsed !== 'object') return null;

  // Array langsung: [ { title, platform, ... }, ... ]
  if (Array.isArray(parsed)) {
    return parsed as LangflowGameResult[];
  }

  const obj = parsed as Record<string, unknown>;

  // { "title": "...", "platform": "..." } — single game
  if ('title' in obj) {
    return [obj as unknown as LangflowGameResult];
  }

  // Berbagai wrapper key yang mungkin dipakai Langflow Structured Output
  for (const key of ['results', 'games', 'data', 'items', 'giveaways']) {
    if (key in obj && Array.isArray(obj[key])) {
      return obj[key] as LangflowGameResult[];
    }
  }

  return null;
}

function parseStructuredOutput(text: string): LangflowResult {
  const candidate = extractJson(text);

  if (candidate.startsWith('{') || candidate.startsWith('[')) {
    try {
      const parsed = JSON.parse(candidate);
      const games = extractGamesFromParsed(parsed);
      if (games && games.length > 0) {
        return { kind: 'structured', games };
      }
      // JSON valid tapi tidak ada games yang dikenali — log untuk debug
      logger.warn('Langflow JSON parsed but no games extracted', {
        keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed as object) : [],
      });
    } catch (e) {
      logger.warn('Langflow response is not valid JSON', { error: String(e) });
    }
  }

  return { kind: 'text', text };
}

export async function sendMessageToLangflow(
  inputValue: string,
  sessionId: string,
): Promise<LangflowResult> {
  const url = `${config.langflow.serverUrl}/api/v1/run/${config.langflow.flowId}`;

  logger.info('Sending message to Langflow', { sessionId, url });

  try {
    const response = await axios.post<LangflowResponse>(
      url,
      {
        input_value: inputValue,
        input_type: 'chat',
        output_type: 'chat',
        session_id: sessionId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.langflow.apiKey,
        },
        timeout: config.langflow.timeoutMs,
      },
    );

    const text =
      response.data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text;

    if (!text) {
      logger.warn('Langflow response missing text', { sessionId });
      throw new LangflowError('Empty response from Langflow');
    }

    logger.info('Received response from Langflow', { sessionId });
    return parseStructuredOutput(text);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError;
      if (axiosErr.code === 'ECONNABORTED') {
        throw new TimeoutError('Langflow request timed out');
      }
      throw new LangflowError(
        `Langflow request failed: ${axiosErr.message}`,
        axiosErr.response?.status,
      );
    }
    throw err;
  }
}
