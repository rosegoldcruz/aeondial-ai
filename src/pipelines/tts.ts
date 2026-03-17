import { ElevenLabsClient } from 'elevenlabs';
import { config } from '../utils/config';
import { resolveProviders, AgentScope } from '../core/providers';
import { logger } from '../utils/logger';

const eleven = new ElevenLabsClient({ apiKey: config.elevenLabsApiKey });

export async function synthesizeSpeech(text: string, scope: AgentScope) {
  const providerStack = await resolveProviders(scope);

  logger.info(
    {
      org_id: scope.org_id,
      campaign_id: scope.campaign_id,
      agent_id: scope.agent_id,
      provider_stack: providerStack,
    },
    'Selecting TTS provider',
  );

  switch (providerStack.tts_provider) {
    case 'elevenlabs':
      break;
    default:
      throw new Error(`Unsupported TTS provider: ${providerStack.tts_provider}`);
  }

  if (!config.elevenLabsApiKey) {
    throw new Error('ELEVENLABS_API_KEY missing');
  }

  const audio = await eleven.textToSpeech.convert(
    providerStack.voice_id,
    {
      text,
      model_id: providerStack.model_id,
    },
  );

  return audio;
}
