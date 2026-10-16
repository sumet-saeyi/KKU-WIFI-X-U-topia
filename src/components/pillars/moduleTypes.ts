import type { LanguageCode, PendingSignatureRequest, ToolCallTrace } from '@/lib/types';

export interface AgentResult { text: string; source: 'live' | 'stage-safe'; }

export interface BaseModuleProps {
  language: LanguageCode;
  stageSafeMode: boolean;
  onSpeak: (text: string) => void;
  onSignature: (request: PendingSignatureRequest, trace: ToolCallTrace) => void;
  onTrace: (trace: ToolCallTrace) => void;
  runAgent: (kind: string, prompt: string, image?: string) => Promise<AgentResult>;
  notify: (message: string) => void;
}
