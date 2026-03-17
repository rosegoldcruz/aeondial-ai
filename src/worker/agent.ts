import { generateReply } from '../pipelines/llm';
import { synthesizeSpeech } from '../pipelines/tts';
import { AgentScope } from '../core/providers';
import { postAiEvent } from '../core/callbacks';
import { logger } from '../utils/logger';

export async function handleTurn(
  userText: string,
  scope: AgentScope,
): Promise<Buffer | null> {
  logger.info({ userText, scope }, 'Agent handling turn');

  await postAiEvent('transcript', scope, { role: 'user', text: userText });

  try {
    const reply = await generateReply(userText, scope);
    logger.info({ reply }, 'Agent LLM reply');

    await postAiEvent('transcript', scope, { role: 'assistant', text: reply });
    await postAiEvent('summary', scope, { summary: reply.slice(0, 200) });

    const audio = await synthesizeSpeech(reply, scope);
    return audio as unknown as Buffer;
  } catch (error) {
    await postAiEvent('error', scope, {
      message: error instanceof Error ? error.message : 'Unknown agent error',
    });
    throw error;
  }
}
