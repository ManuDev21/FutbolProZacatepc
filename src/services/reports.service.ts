import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '@/db/database';
import { nowISO, uuid, formatCurrency, formatDate, fullName, calcAge, periodLabel } from '@/lib/utils';
import { PDF_GOLD, PDF_GRAY, PDF_GREEN, drawRadar, imageToDataUrl } from '@/lib/pdf';
import type { Evaluation, Player } from '@/types';
import { playersService } from './players.service';
import { settingsService } from './settings.service';
import { auditService } from './audit.service';
import { effectiveStatus } from './payments.service';

const EVAL_LABELS: [keyof Evaluation['scores'], string][] = [
  ['tecnica', 'Técnica'],
  ['velocidad', 'Velocidad'],
  ['tactica', 'Táctica'],
  ['fisico', 'Físico'],
  ['actitud', 'Actitud'],
];

const STATUS_LABEL: Record<string, string> = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  parcial: 'Parcial',
};

async function header(doc: jsPDF, title: string): Promise<number> {
  const school = await settingsService.getSchool();
  doc.setFillColor(...PDF_GREEN);
  doc.rect(0, 0, 210, 30, 'F');
  try {
    const logo = school?.logo ?? (await imageToDataUrl('/logo.svg', 128).catch(() => null));
    if (logo) doc.addImage(logo, 'PNG', 10, 5, 20, 20);
  } catch {
    /* logo opcional */
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(school?.name ?? 'FútbolPro Zacatepec', 36, 13);
  doc.setFontSize(10);
  doc.setTextColor(...PDF_GOLD);
  doc.text(title, 36, 21);
  doc.setTextColor(200, 220, 208);
  doc.text(`Generado: ${formatDate(nowISO(), { day: '2-digit', month: 'long', year: 'numeric' })}`, 200, 13, {
    align: 'right',
  });
  doc.setTextColor(30, 30, 30);
  return 38;
}

function footer(doc: jsPDF) {
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...PDF_GRAY);
  doc.text('FútbolProZacatepec — datos almacenados localmente en este dispositivo.', 105, h - 8, {
    align: 'center',
  });
}

/** Reporte individual de jugador en PDF. Devuelve el documento. */
export async function buildPlayerReportPdf(player: Player): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = await header(doc, 'Reporte de jugador');

  const [category, stats, evaluations, payments, guardians] = await Promise.all([
    player.categoryId ? db.categories.get(player.categoryId) : undefined,
    playersService.stats(player.id),
    db.evaluations.where('playerId').equals(player.id).sortBy('date'),
    db.payments.where('playerId').equals(player.id).sortBy('dueDate'),
    db.guardians.filter((g) => g.playerIds.includes(player.id)).toArray(),
  ]);

  // Ficha
  doc.setFontSize(16);
  doc.setTextColor(...PDF_GREEN);
  doc.text(fullName(player), 14, y);
  if (player.photo) {
    try {
      doc.addImage(player.photo, 'WEBP', 165, y - 8, 30, 30);
    } catch {
      /* foto opcional */
    }
  }
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const meta = [
    `Categoría: ${category?.name ?? '—'}`,
    `Edad: ${calcAge(player.birthDate)} años`,
    `Posición: ${player.position ?? '—'}`,
    `Número: ${player.jerseyNumber ?? '—'}`,
    `Estado: ${player.status}`,
    `Ingreso: ${formatDate(player.joinedAt)}`,
    `Tutor: ${guardians.map((g) => fullName(g)).join(', ') || '—'}`,
  ];
  meta.forEach((line) => {
    doc.text(line, 14, y);
    y += 5;
  });
  y += 2;

  // Asistencia
  doc.setFontSize(12);
  doc.setTextColor(...PDF_GREEN);
  doc.text('Asistencia', 14, y);
  y += 3;
  autoTable(doc, {
    startY: y,
    head: [['Sesiones', 'Presentes', 'Ausentes', 'Retardos', 'Justificados', '% Asistencia']],
    body: [
      [
        stats.attendance.total,
        stats.attendance.presentes,
        stats.attendance.ausentes,
        stats.attendance.retardos,
        stats.attendance.justificados,
        `${stats.attendance.porcentaje}%`,
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: PDF_GREEN },
    styles: { fontSize: 9, halign: 'center' },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Pagos
  doc.setFontSize(12);
  doc.setTextColor(...PDF_GREEN);
  doc.text('Estado de pagos', 14, y);
  y += 3;
  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Periodo', 'Monto', 'Vence', 'Estado']],
    body: payments
      .slice(-8)
      .map((p) => [
        p.concept,
        p.period ? periodLabel(p.period) : '—',
        formatCurrency(p.amount),
        formatDate(p.dueDate),
        STATUS_LABEL[effectiveStatus(p)],
      ]),
    theme: 'striped',
    headStyles: { fillColor: PDF_GREEN },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Evaluación + radar
  if (evaluations.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setTextColor(...PDF_GREEN);
    doc.text('Evaluación de rendimiento', 14, y);
    y += 4;
    const current = evaluations.at(-1)!;
    const previous = evaluations.at(-2);
    const datasets = [
      {
        name: 'Actual',
        values: EVAL_LABELS.map(([k]) => current.scores[k]),
        color: '#177541',
      },
      ...(previous
        ? [
            {
              name: 'Anterior',
              values: EVAL_LABELS.map(([k]) => previous.scores[k]),
              color: '#f5a801',
            },
          ]
        : []),
    ];
    const radar = drawRadar(
      EVAL_LABELS.map(([, l]) => l),
      datasets,
      340,
    );
    doc.addImage(radar, 'PNG', 20, y, 85, 85);

    // Tabla comparativa
    autoTable(doc, {
      startY: y + 4,
      head: [['Área', 'Anterior', 'Actual', 'Δ']],
      body: EVAL_LABELS.map(([k, label]) => {
        const prev = previous?.scores[k];
        const cur = current.scores[k];
        return [label, prev ?? '—', cur, prev != null ? `${cur - prev > 0 ? '+' : ''}${cur - prev}` : '—'];
      }),
      theme: 'grid',
      headStyles: { fillColor: PDF_GREEN },
      styles: { fontSize: 9, halign: 'center' },
      margin: { left: 115, right: 14 },
      tableWidth: 80,
    });
    y += 92;
  }

  // Observaciones
  if (player.notes) {
    doc.setFontSize(11);
    doc.setTextColor(...PDF_GREEN);
    doc.text('Observaciones', 14, y);
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(doc.splitTextToSize(player.notes, 180), 14, y + 5);
  }

  footer(doc);

  await db.reports.add({
    id: uuid(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    kind: 'jugador',
    label: `Reporte ${fullName(player)}`,
    playerId: player.id,
  });
  await auditService.log('generar-reporte', 'reporte', player.id, fullName(player));
  return doc;
}

/** Comparte o descarga el PDF generado. */
export async function deliverPdf(doc: jsPDF, filename: string, share = false): Promise<void> {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (share && 'canShare' in navigator && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: filename });
    return;
  }
  doc.save(filename);
}
