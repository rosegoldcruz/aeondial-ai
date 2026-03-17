import dotenv from 'dotenv';
dotenv.config();

import { createId } from '@paralleldrive/cuid2';
import { logger } from './utils/logger';
import { connectToLiveKit } from './livekit/client';
import { generateReply } from './pipelines/llm';
import { synthesizeSpeech } from './pipelines/tts';
import { AgentScope, resolveProviders } from './core/providers';

async function main() {
  logger.info('AEONDial AI Worker starting up...');

  const scope: AgentScope = {
    org_id: process.env.ORG_ID || 'default-tenant',
    campaign_id: process.env.CAMPAIGN_ID || 'default-campaign',
    agent_id: `AI-${createId()}`,
  };

  const providerStack = await resolveProviders(scope);
  logger.info(
    {
      org_id: scope.org_id,
      campaign_id: scope.campaign_id,
      agent_id: scope.agent_id,
      provider_stack: providerStack,
    },
    'AI worker started with tenant-scoped context',
  );

  await connectToLiveKit();

  const reply = await generateReply('AEONDial AI worker boot check', scope);

  logger.info({ reply }, 'LLM reply from configured provider');

  await synthesizeSpeech('AEONDial AI worker is online.', scope);

  logger.info('AEONDial AI Worker initialized.');
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error in AEONDial AI Worker');
  process.exit(1);
});
