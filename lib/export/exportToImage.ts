// lib/export/exportToImage.ts

type ExportFormat = 'png' | 'jpg';

export type ExportToImageOptions = {
  /** override background; use null for transparency */
  backgroundColor?: string | null;
  /** html2canvas scale */
  scale?: number;
};

function ensureExt(name: string, format: ExportFormat) {
  const base = name.trim() || `minha_lista_${Date.now()}`;
  return base.toLowerCase().endsWith(`.${format}`) ? base : `${base}.${format}`;
}

export async function exportToImage(
  elementId: string,
  format: ExportFormat,
  fileBaseName?: string,
  options: ExportToImageOptions = {}
) {
  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Elemento com ID "${elementId}" não encontrado`);

    const { default: html2canvas } = await import('html2canvas');

    const rect = element.getBoundingClientRect();
    const width = Math.ceil(Math.max(element.scrollWidth, rect.width));
    const height = Math.ceil(Math.max(element.scrollHeight, rect.height));

    const canvas = await html2canvas(element, {
      backgroundColor:
        typeof options.backgroundColor !== 'undefined'
          ? options.backgroundColor
          : format === 'png'
            ? null
            : '#0b0b12',
      scale: options.scale ?? 2,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        format === 'png' ? 'image/png' : 'image/jpeg',
        0.95
      );
    });

    if (!blob) throw new Error('Falha ao gerar imagem');

    const fileName = ensureExt(fileBaseName || `minha_lista_${Date.now()}`, format);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (error) {
    console.error('Erro ao exportar imagem:', error);
    return { success: false, error: String(error) };
  }
}
