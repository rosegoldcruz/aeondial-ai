import { logger } from '../utils/logger';
import { AgentScope } from './providers';

type AiEventType =
  | 'transcript'
  | 'summary'
  | 'disposition'
  | 'appointment'
  | 'transfer'
  | 'error';

const BACKEND_URL = process.env.AEONDIAL_BACKEND_URL || 'http://localhost:4000';
const RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function postAiEvent(
  type: AiEventType,
  scope: AgentScope,
  payload: unknown,
): Promise<void> {
  const url = `${BACKEND_URL}/ai/events`;

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          org_id: scope.org_id,
          campaign_id: scope.campaign_id,
          agent_id: scope.agent_id,
          payload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Event callback failed with status ${res.status}`);
      }

      return;
    } catch (error) {
      if (attempt === RETRIES) {
        logger.warn(
          {
            error,
            type,
            org_id: scope.org_id,
            campaign_id: scope.campaign_id,
            agent_id: scope.agent_id,
          },
          'Failed posting AI event after retries',
        );
        return;
      }

      await sleep(200 * 2 ** attempt);
    }
  }
}