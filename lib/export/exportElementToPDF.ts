// lib/export/exportElementToPDF.ts
// Exporta um elemento DOM para PDF (client-side). Usa html2canvas + jsPDF.

export type ExportElementToPDFOptions = {
  scale?: number; // default 2
  backgroundColor?: string | null; // null tenta manter transparência
  fileNameSuffix?: string; // opcional
};

export async function exportElementToPDF(
  elementId: string,
  fileBaseName: string,
  opts: ExportElementToPDFOptions = {}
): Promise<{ success: boolean; fileName?: string; error?: string }> {
  try {
    const el = document.getElementById(elementId);
    if (!el) {
      return { success: false, error: `Elemento não encontrado: #${elementId}` };
    }

    const scale = typeof opts.scale === 'number' ? opts.scale : 2;

    const [{ default: html2canvas }, jspdfMod] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const JsPDFCtor: any = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default;

    const canvas = await html2canvas(el, {
      backgroundColor:
        opts.backgroundColor === undefined ? '#ffffff' : opts.backgroundColor,
      scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');

    const w = canvas.width;
    const h = canvas.height;

    const pdf = new JsPDFCtor({
      orientation: w >= h ? 'landscape' : 'portrait',
      unit: 'px',
      format: [w, h],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, w, h);

    const suffix = opts.fileNameSuffix ? `_${opts.fileNameSuffix}` : '';
    const fileName = `${fileBaseName}${suffix}_${Date.now()}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
