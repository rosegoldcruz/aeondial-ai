import OpenAI from 'openai';
import axios from 'axios';
import { config } from '../utils/config';
import { resolveProviders, AgentScope } from '../core/providers';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function transcribeAudio(
  audioBuffer: Buffer,
  scope: AgentScope,
): Promise<string> {
  const providers = await resolveProviders(scope);
  logger.info(
    {
      org_id: scope.org_id,
      campaign_id: scope.campaign_id,
      agent_id: scope.agent_id,
      provider_stack: providers,
    },
    'Selecting STT provider',
  );

  switch (providers.stt_provider) {
    case 'openai': {
      if (!config.openaiApiKey) {
        throw new Error('OPENAI_API_KEY missing');
      }

      const file = new File([new Uint8Array(audioBuffer)], 'audio.wav', {
        type: 'audio/wav',
      });
      const response = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
      });

      return response.text || '';
    }

    case 'deepgram': {
      if (!config.deepgramApiKey) {
        throw new Error('DEEPGRAM_API_KEY missing');
      }

      const response = await axios.post(
        'https://api.deepgram.com/v1/listen?model=nova-2',
        audioBuffer,
        {
          headers: {
            Authorization: `Token ${config.deepgramApiKey}`,
            'Content-Type': 'audio/wav',
          },
        },
      );

      return (
        response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
        ''
      );
    }

    default: {
      logger.warn({ provider: providers.stt_provider }, 'Unknown STT provider');
      return '';
    }
  }
}
