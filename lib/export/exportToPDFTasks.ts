// lib/export/exportToPDFTasks.ts

export type TaskItemForPDF = {
  text: string;
  done?: boolean;
};

function ensurePdfName(name: string) {
  const base = name.trim() || `lista_${Date.now()}`;
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

export async function exportTasksToPDF(args: {
  title: string;
  subtitle?: string;
  items: TaskItemForPDF[];
  fileBaseName?: string;
}) {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 48;
  const marginY = 56;
  const lineHeight = 18;
  const boxSize = 12;

  const titleFont = 18;
  const bodyFont = 11;

  let y = marginY;
  doc.setTextColor(20);
  doc.setFontSize(titleFont);
  doc.text(args.title || 'Lista', marginX, y);

  y += 24;
  if (args.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(args.subtitle, marginX, y);
    y += 18;
  }

  doc.setFontSize(bodyFont);
  doc.setTextColor(30);

  const maxWidth = pageWidth - marginX * 2 - boxSize - 10;

  const addPage = () => {
    doc.addPage();
    y = marginY;
  };

  for (const item of args.items) {
    const text = (item.text ?? '').trim();
    if (!text) continue;

    const lines = doc.splitTextToSize(text, maxWidth) as string[];

    const needed = Math.max(lineHeight, lines.length * lineHeight);
    if (y + needed + marginY > pageHeight) addPage();

    const boxY = y - boxSize + 3;
    doc.rect(marginX, boxY, boxSize, boxSize);
    if (item.done) {
      doc.setLineWidth(1.2);
      doc.line(marginX + 2, boxY + boxSize / 2, marginX + boxSize / 2, boxY + boxSize - 2);
      doc.line(marginX + boxSize / 2, boxY + boxSize - 2, marginX + boxSize - 2, boxY + 2);
      doc.setLineWidth(0.2);
    }

    doc.text(lines, marginX + boxSize + 10, y);
    y += lines.length * lineHeight;
  }

  const foot = 'Destinote — Minhas Listas';
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(foot, marginX, pageHeight - 28);

  const fileName = ensurePdfName(args.fileBaseName || `lista_${Date.now()}`);
  doc.save(fileName);

  return { success: true, fileName } as const;
}
