import { handleTurn } from './agent';
import { AgentScope } from '../core/providers';
import { logger } from '../utils/logger';

export async function handleInboundCall(
  _callId: string,
  scope: AgentScope,
) {
  logger.info({ scope }, 'Inbound call handler stub invoked');

  const audio = await handleTurn('Hello from AEONDial inbound.', scope);
  logger.info({ hasAudio: !!audio }, 'Inbound call handled (stub)');
}
