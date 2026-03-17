import { logger } from '../utils/logger';
import { AgentScope, createBackendHeaders } from './providers';

type AiEventType =
  | 'transcript'
  | 'summary'
  | 'disposition'
  | 'appointment'
  | 'transfer'
  | 'error';

const BACKEND_URL =
  (process.env.BACKEND_URL || process.env.AEONDIAL_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
const MAX_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status >= 500;
}

export async function postAiEvent(
  type: AiEventType,
  scope: AgentScope,
  payload: unknown,
): Promise<void> {
  const url = `${BACKEND_URL}/ai/events`;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: createBackendHeaders(scope, scope.agent_id),
        body: JSON.stringify({
          type,
          org_id: scope.org_id,
          campaign_id: scope.campaign_id,
          agent_id: scope.agent_id,
          call_id: scope.call_id,
          payload,
        }),
      });

      if (!res.ok) {
        if (isRetryableStatus(res.status) && attempt < MAX_ATTEMPTS - 1) {
          throw new Error(`Event callback failed with status ${res.status}`);
        }

        throw new Error(`Event callback failed with status ${res.status}`);
      }

      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS - 1) {
        logger.warn(
          {
            error,
            type,
            org_id: scope.org_id,
            campaign_id: scope.campaign_id,
            agent_id: scope.agent_id,
            call_id: scope.call_id,
          },
          'Failed posting AI event after retries',
        );
        return;
      }

      await sleep(200 * 2 ** attempt);
    }
  }
}