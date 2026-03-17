export type LlmProvider = 'openai' | 'deepseek' | 'anthropic';
export type TtsProvider = 'elevenlabs';
export type SttProvider = 'openai' | 'deepgram';
export type ProviderName = LlmProvider | TtsProvider | SttProvider;

export interface ProviderSelection {
  llm: LlmProvider;
  tts: TtsProvider;
  stt: SttProvider;
}

export interface AgentContext {
  org_id: string;
  campaign_id?: string;
  agent_id: string;
}
