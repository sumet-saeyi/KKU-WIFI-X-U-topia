import type { LanguageCode, PendingSignatureRequest, ToolCallTrace } from '@/lib/types';

export interface BaseModuleProps {
  language: LanguageCode;
  stageSafeMode: boolean;
  onSpeak: (text: string) => void;
  onSignature: (request: PendingSignatureRequest, trace: ToolCallTrace) => void;
  onTrace: (trace: ToolCallTrace) => void;
  runAgent: (kind: string, prompt: string, image?: string) => Promise<string>;
  notify: (message: string) => void;
}
