import { logger } from '../utils/logger';
import { handleInboundCall, handleOutboundCall } from '../worker';
import { createId } from '@paralleldrive/cuid2';
import { AgentScope } from '../core/providers';

// In the future, this will subscribe to AEONDialBackend / Telephony events
// and route them into the AI worker.

export async function handleAriEvent(event: any) {
  logger.info({ event }, 'Received ARI event (stub)');

  const scope: AgentScope = {
    org_id: event.org_id || event.tenantId || 'default-tenant',
    campaign_id: event.campaign_id || event.campaignId || 'default-campaign',
    agent_id: `AI-${createId()}`,
  };

  if (event.direction === 'inbound') {
    await handleInboundCall(event.callId, scope);
  } else {
    await handleOutboundCall(event.callId, scope);
  }
}
