import { words } from './i18n';
import type { LanguageCode } from './types';

/** Credential presence is not proof that the provider has answered successfully. */
export function aiAvailabilityLabel(language: LanguageCode, offline: boolean, configured: boolean | null, answered = false): string {
  if (offline) return words(language, 'No connection · saved guides available', 'ไม่ได้เชื่อมต่อ · มีคำตอบสำรอง', 'Sin conexión · guías guardadas disponibles');
  if (answered) return words(language, 'Live reply received · U-Bot', 'ได้รับคำตอบสดแล้ว · U-Bot', 'Respuesta en vivo recibida · U-Bot');
  if (configured === false) return words(language, 'AI not configured · saved guide backup', 'AI ยังไม่ตั้งค่า · มีคำตอบสำรอง', 'IA sin configurar · guía de respaldo');
  if (configured) return words(language, 'U-Bot configured · connects on Send', 'ตั้งค่า U-Bot แล้ว · เชื่อมต่อเมื่อส่ง', 'U-Bot configurado · conecta al enviar');
  return words(language, 'AI connection not checked · tries on Send', 'ยังไม่ตรวจการเชื่อมต่อ AI · ลองเมื่อส่ง', 'Conexión de IA sin verificar · intenta al enviar');
}
