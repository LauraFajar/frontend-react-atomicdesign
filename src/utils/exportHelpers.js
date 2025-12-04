import sensoresService from '../services/sensoresService';
import { downloadBlob } from './downloadFile';

export const readBlobAsText = async (blob) => {
  try {
    return await new Response(blob).text();
  } catch {
    return '';
  }
};

// Verificar la firma del PDF: debe empezar con %PDF
const isPdfBlob = async (blob) => {
  try {
    const header = await new Response(blob.slice(0, 4)).text();
    return header.startsWith('%PDF');
  } catch {
    return false;
  }
};

export const exportPdfWithFallback = async (buildParams, generateLocalPDF, alert) => {
  const params = buildParams();
  const res = await sensoresService.exportIotPdf(params);

  if (res.status === 200) {
    const ct = (res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || 'application/pdf';
    const isPdfHeader = ct.includes('application/pdf');
    const blob = new Blob([res.data], { type: 'application/pdf' });

    // Validar tanto el header como la firma del contenido
    const isPdfSignature = await isPdfBlob(blob);
    if (!isPdfHeader || !isPdfSignature) {
      const hint = await readBlobAsText(res.data);
      alert?.error?.('Archivo inválido', `El servidor respondió con contenido no-PDF. ${hint || ''}`);
      generateLocalPDF();
      return false;
    }

    const filename = `reporte-agrotic-${new Date().toISOString().split('T')[0]}.pdf`;
    const ok = downloadBlob(blob, filename);
    if (ok) alert?.success?.('Éxito', 'PDF generado desde el servidor');
    return ok;
  }

  const serverMsg = await readBlobAsText(res.data);
  const hint = serverMsg || `Estado ${res.status} del servidor`;
  console.warn('Export PDF backend error:', hint);

  if (res.status === 404) {
    alert?.info?.('Sin datos', 'No hay datos en backend, generando PDF local con AGROTIC...');
  } else {
    alert?.error?.('Error', `No se pudo generar el PDF en servidor. ${hint}. Usando PDF local.`);
  }

  generateLocalPDF();
  return false;
};