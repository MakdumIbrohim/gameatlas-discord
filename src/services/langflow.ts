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

export async function sendMessageToLangflow(
  inputValue: string,
  sessionId: string,
): Promise<string> {
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
    return text;
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
