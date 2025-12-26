// lib/export/exportToPDF.ts

type Goal = {
  id: number;
  title: string;
  local?: string | null;
  category?: { name: string } | null;
};

function safeBaseName(input: string) {
  const raw = (input || 'Minha Lista')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const cleaned = raw
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);

  return cleaned || 'Minha_Lista';
}

export async function exportToPDF(goals: Goal[], customTitle: string) {
  try {
    // MERGE: dynamic import pra não pesar o bundle inicial
    const mod = await import('jspdf');
    const JsPDFCtor: any = (mod as any).jsPDF ?? (mod as any).default;
    const pdf = new JsPDFCtor({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Fundo clarinho
    pdf.setFillColor(250, 250, 252);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Título
    const title = (customTitle || 'Minha Lista').trim() || 'Minha Lista';
    pdf.setFontSize(24);
    pdf.setTextColor(30, 30, 50);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, 30);

    // Linha decorativa
    pdf.setDrawColor(100, 100, 150);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 35, pageWidth - margin, 35);

    // Data
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 120);
    pdf.setFont('helvetica', 'normal');
    const date = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    pdf.text(`Gerado em ${date}`, margin, 42);

    // Contador
    pdf.text(
      `Total: ${goals.length} ${goals.length === 1 ? 'objetivo' : 'objetivos'}`,
      pageWidth - margin - 55,
      42
    );

    let y = 55;
    const lineHeight = 12;
    const itemSpacing = 8;

    goals.forEach((goal, index) => {
      // Nova página
      if (y > pageHeight - margin - 20) {
        pdf.addPage();
        y = margin;
        pdf.setFillColor(250, 250, 252);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      // Número
      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 100);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}.`, margin, y);

      // Título do goal
      pdf.setFontSize(12);
      pdf.setTextColor(30, 30, 50);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(goal.title, contentWidth - 10);
      pdf.text(titleLines, margin + 8, y);
      y += lineHeight * titleLines.length;

      // Local
      if (goal.local) {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 120);
        pdf.setFont('helvetica', 'normal');
        const locLines = pdf.splitTextToSize(`📍 ${goal.local}`, contentWidth - 10);
        pdf.text(locLines, margin + 8, y);
        y += lineHeight * locLines.length;
      }

      // Categoria
      if (goal.category?.name) {
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 140);
        pdf.setFont('helvetica', 'italic');
        pdf.text(goal.category.name, margin + 8, y);
        y += lineHeight;
      }

      y += itemSpacing;
    });

    // Rodapé
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 160);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Destinote', pageWidth / 2, pageHeight - 10, { align: 'center' });

    const fileName = `${safeBaseName(title)}_${Date.now()}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return { success: false, error: String(error) };
  }
}
