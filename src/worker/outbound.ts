import { handleTurn } from './agent';
import { AgentScope } from '../core/providers';
import { logger } from '../utils/logger';

export async function handleOutboundCall(
  _callId: string,
  scope: AgentScope,
) {
  logger.info({ scope }, 'Outbound call handler stub invoked');

  const audio = await handleTurn('Hello from AEONDial outbound.', scope);
  logger.info({ hasAudio: !!audio }, 'Outbound call handled (stub)');
}
