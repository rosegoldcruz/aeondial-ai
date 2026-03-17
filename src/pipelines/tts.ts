import { ElevenLabsClient } from 'elevenlabs';
import { config } from '../utils/config';
import { resolveProviders, AgentScope } from '../core/providers';
import { logger } from '../utils/logger';

const eleven = new ElevenLabsClient({ apiKey: config.elevenLabsApiKey });

export async function synthesizeSpeech(text: string, scope: AgentScope) {
  const providers = await resolveProviders(scope);

  logger.info(
    {
      org_id: scope.org_id,
      campaign_id: scope.campaign_id,
      agent_id: scope.agent_id,
      provider_stack: providers,
    },
    'Selecting TTS provider',
  );

  if (providers.tts_provider !== 'elevenlabs') {
    throw new Error(`Unsupported TTS provider: ${providers.tts_provider}`);
  }

  if (!config.elevenLabsApiKey) {
    throw new Error('ELEVENLABS_API_KEY missing');
  }

  const audio = await eleven.textToSpeech.convert(
    providers.voice_id,
    {
      text,
      model_id: providers.model_id || 'eleven_monolingual_v1',
    },
  );

  return audio;
}
