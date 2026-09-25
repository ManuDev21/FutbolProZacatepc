import type { Guardian, Payment, Player } from '@/types';
import { formatCurrency, formatDate, fullName, periodLabel } from '@/lib/utils';

/**
 * WhatsApp sin backend: se construye un enlace wa.me con el mensaje
 * pre-llenado. El envío lo hace el usuario desde su propia app.
 */

export function waLink(phone: string | undefined, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const num = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string | undefined, message: string) {
  const link = waLink(phone, message);
  if (link) window.open(link, '_blank', 'noopener');
  return link;
}

export function paymentReminderMessage(
  guardian: Guardian | undefined,
  player: Player,
  payment: Payment,
): string {
  const greeting = guardian ? `Hola ${guardian.firstName}` : 'Hola';
  return [
    `${greeting}, te saluda *FútbolPro Zacatepec* 🟢⚪`,
    '',
    `Te recordamos que la mensualidad de *${fullName(player)}*`,
    `correspondiente a *${payment.period ? periodLabel(payment.period) : formatDate(payment.dueDate)}* se encuentra pendiente.`,
    '',
    `Monto: *${formatCurrency(payment.amount - (payment.amountPaid ?? 0))}*`,
    `Fecha límite: ${formatDate(payment.dueDate)}`,
    '',
    '¡Gracias por tu preferencia! ⚽',
  ].join('\n');
}

export function paymentConfirmMessage(player: Player, payment: Payment): string {
  return [
    `*FútbolPro Zacatepec* 🟢⚪`,
    '',
    `Confirmamos la recepción del pago de *${fullName(player)}*`,
    `Concepto: ${payment.concept}${payment.period ? ` (${periodLabel(payment.period)})` : ''}`,
    `Monto: *${formatCurrency(payment.amountPaid ?? payment.amount)}*`,
    '',
    '¡Gracias! ⚽',
  ].join('\n');
}

export function attendanceMessage(player: Player, status: string, date: string): string {
  const labels: Record<string, string> = {
    presente: '✅ Presente',
    ausente: '❌ Ausente',
    retardo: '🟡 Retardo',
    justificado: '📝 Ausencia justificada',
  };
  return [
    `*FútbolPro Zacatepec* — Reporte de asistencia`,
    '',
    `Jugador: *${fullName(player)}*`,
    `Fecha: ${formatDate(date)}`,
    `Estado: ${labels[status] ?? status}`,
  ].join('\n');
}

export function reportMessage(player: Player): string {
  return [
    `*FútbolPro Zacatepec* 🟢⚪`,
    '',
    `Se generó el reporte de rendimiento de *${fullName(player)}*.`,
    'Solicítalo en la aplicación o pide tu copia en PDF. ⚽',
  ].join('\n');
}

export function customMessage(text: string): string {
  return text;
}
