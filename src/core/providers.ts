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

export interface ProviderScope {
  org_id: string;
  campaign_id?: string;
}

export interface AgentScope extends ProviderScope {
  agent_id: string;
  call_id?: string;
}

const BACKEND_URL =
  (process.env.BACKEND_URL || process.env.AEONDIAL_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
const MAX_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status >= 500;
}

function isLlmProvider(value: unknown): value is LlmProvider {
  return value === 'openai' || value === 'deepseek' || value === 'anthropic';
}

function isTtsProvider(value: unknown): value is TtsProvider {
  return value === 'elevenlabs';
}

function isSttProvider(value: unknown): value is SttProvider {
  return value === 'openai' || value === 'deepgram';
}

function normalizeProviderStack(data: unknown): ProviderStack {
  if (!data || typeof data !== 'object') {
    throw new Error('Backend returned an invalid provider payload');
  }

  const stack = data as Partial<ProviderStack>;
  if (!isLlmProvider(stack.llm_provider)) {
    throw new Error(`Unsupported llm_provider from backend: ${String(stack.llm_provider)}`);
  }
  if (!isTtsProvider(stack.tts_provider)) {
    throw new Error(`Unsupported tts_provider from backend: ${String(stack.tts_provider)}`);
  }
  if (!isSttProvider(stack.stt_provider)) {
    throw new Error(`Unsupported stt_provider from backend: ${String(stack.stt_provider)}`);
  }
  if (!stack.voice_id || !stack.model_id) {
    throw new Error('Backend returned an incomplete provider payload');
  }

  return {
    llm_provider: stack.llm_provider,
    tts_provider: stack.tts_provider,
    stt_provider: stack.stt_provider,
    voice_id: stack.voice_id,
    model_id: stack.model_id,
  };
}

export function createBackendHeaders(scope: ProviderScope, agentId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-org-id': scope.org_id,
    'x-role': 'agent',
  };

  if (agentId) {
    headers['x-user-id'] = agentId;
  }

  return headers;
}

export async function resolveProviders(scope: ProviderScope): Promise<ProviderStack> {
  const params = new URLSearchParams({ org_id: scope.org_id });
  if (scope.campaign_id) {
    params.set('campaign_id', scope.campaign_id);
  }

  const url = `${BACKEND_URL}/ai/settings?${params.toString()}`;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: createBackendHeaders(scope),
      });
      if (!res.ok) {
        if (isRetryableStatus(res.status) && attempt < MAX_ATTEMPTS - 1) {
          throw new Error(`Provider API returned ${res.status}`);
        }

        throw new Error(`Provider API returned ${res.status}`);
      }

      const stack = normalizeProviderStack(await res.json());

      logger.info(
        {
          org_id: scope.org_id,
          campaign_id: scope.campaign_id,
          provider_stack: stack,
        },
        'Resolved provider stack from backend',
      );

      return stack;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS - 1) {
        logger.error(
          {
            error,
            org_id: scope.org_id,
            campaign_id: scope.campaign_id,
          },
          'Failed to resolve providers from backend after retries',
        );
        throw error;
      }

      const backoffMs = 200 * 2 ** attempt;
      await sleep(backoffMs);
    }
  }

  throw new Error('Failed to resolve providers from backend');
}