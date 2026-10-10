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

function parseStructuredOutput(text: string): LangflowResult {
  const candidate = extractJson(text);

  // Coba parse sebagai JSON object tunggal atau array
  if (candidate.startsWith('{') || candidate.startsWith('[')) {
    try {
      const parsed = JSON.parse(candidate);
      // Array of games
      if (Array.isArray(parsed)) {
        return { kind: 'structured', games: parsed as LangflowGameResult[] };
      }
      // Single game object
      if (parsed && typeof parsed === 'object' && 'title' in parsed) {
        return { kind: 'structured', games: [parsed as LangflowGameResult] };
      }
      // Object dengan key "games"
      if (parsed && typeof parsed === 'object' && 'games' in parsed && Array.isArray(parsed.games)) {
        return { kind: 'structured', games: parsed.games as LangflowGameResult[] };
      }
    } catch {
      // bukan JSON valid, fallback ke text
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
