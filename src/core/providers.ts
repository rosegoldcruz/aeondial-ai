import { logger } from '../utils/logger';

export type LlmProvider = 'openai' | 'deepseek' | 'anthropic';
export type TtsProvider = 'elevenlabs';
export type SttProvider = 'openai' | 'deepgram';

export interface ProviderStack {
  llm_provider: LlmProvider;
  tts_provider: TtsProvider;
  stt_provider: SttProvider;
  voice_id: string;
  model_id: string;
}

export interface AgentScope {
  org_id: string;
  campaign_id?: string;
  agent_id: string;
}

const BACKEND_URL = process.env.AEONDIAL_BACKEND_URL || 'http://localhost:4000';

const defaultStack: ProviderStack = {
  llm_provider: 'openai',
  tts_provider: 'elevenlabs',
  stt_provider: 'openai',
  voice_id: process.env.ELEVENLABS_VOICE_ID || 'default',
  model_id: process.env.DEFAULT_MODEL_ID || 'gpt-4.1-mini',
};

const RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resolveProviders(scope: AgentScope): Promise<ProviderStack> {
  const params = new URLSearchParams({ org_id: scope.org_id });
  if (scope.campaign_id) {
    params.set('campaign_id', scope.campaign_id);
  }

  const url = `${BACKEND_URL}/ai/providers?${params.toString()}`;

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Provider API returned ${res.status}`);
      }

      const data = (await res.json()) as Partial<ProviderStack>;
      const stack: ProviderStack = {
        llm_provider: (data.llm_provider || defaultStack.llm_provider) as LlmProvider,
        tts_provider: (data.tts_provider || defaultStack.tts_provider) as TtsProvider,
        stt_provider: (data.stt_provider || defaultStack.stt_provider) as SttProvider,
        voice_id: data.voice_id || defaultStack.voice_id,
        model_id: data.model_id || defaultStack.model_id,
      };

      logger.info(
        {
          org_id: scope.org_id,
          campaign_id: scope.campaign_id,
          agent_id: scope.agent_id,
          provider_stack: stack,
        },
        'Resolved provider stack from backend',
      );

      return stack;
    } catch (error) {
      if (attempt === RETRIES) {
        logger.warn(
          {
            error,
            org_id: scope.org_id,
            campaign_id: scope.campaign_id,
            agent_id: scope.agent_id,
            provider_stack: defaultStack,
          },
          'Provider API unreachable after retries, falling back to defaults',
        );
        return defaultStack;
      }

      const backoffMs = 200 * 2 ** attempt;
      await sleep(backoffMs);
    }
  }

  return defaultStack;
}