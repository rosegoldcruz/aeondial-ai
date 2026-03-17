import OpenAI from 'openai';
import axios from 'axios';
import { config } from '../utils/config';
import { resolveProviders, AgentScope } from '../core/providers';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function generateReply(
  prompt: string,
  scope: AgentScope,
): Promise<string> {
  const providerStack = await resolveProviders(scope);
  logger.info(
    {
      org_id: scope.org_id,
      campaign_id: scope.campaign_id,
      agent_id: scope.agent_id,
      provider_stack: providerStack,
    },
    'Selecting LLM provider',
  );

  switch (providerStack.llm_provider) {
    case 'openai': {
      if (!config.openaiApiKey) throw new Error('OPENAI_API_KEY missing');

      const completion = await openai.chat.completions.create({
        model: providerStack.model_id,
        messages: [{ role: 'user', content: prompt }],
      });

      return completion.choices[0]?.message?.content || '';
    }

    case 'deepseek': {
      if (!config.deepseekApiKey) throw new Error('DEEPSEEK_API_KEY missing');

      const res = await axios.post(
        process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
        {
          model: providerStack.model_id,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${config.deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return res.data.choices?.[0]?.message?.content || '';
    }

    case 'anthropic': {
      logger.warn(
        {
          org_id: scope.org_id,
          campaign_id: scope.campaign_id,
          agent_id: scope.agent_id,
          provider_stack: providerStack,
        },
        'Anthropic provider selected, using temporary stub response',
      );
      return 'Anthropic provider selected (stub response).';
    }

    default: {
      logger.warn(
        { provider: providerStack.llm_provider },
        'Unknown LLM provider, returning empty string',
      );
      return '';
    }
  }
}
