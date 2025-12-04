import axios from 'axios';
import Cookies from 'js-cookie';

export async function downloadFile(url, params, filename, token) {
  const tok = token || Cookies.get('token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  const headers = tok ? { Authorization: `Bearer ${tok}` } : undefined;

  const res = await axios.get(url, {
    params,
    responseType: 'blob',
    withCredentials: true,
    headers,
  });

  const cd = res.headers['content-disposition'] || res.headers['Content-Disposition'];
  const serverName = extractFilename(cd);
  const name = filename || serverName || 'download';

  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function extractFilename(contentDisposition) {
  if (!contentDisposition) return null;
  const star = /filename\*=(?:UTF-8''|utf-8'')([^;\n]+)/i.exec(contentDisposition);
  if (star && star[1]) {
    try {
      return decodeURIComponent(star[1]);
    } catch (_) {
      return star[1];
    }
  }
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return match ? match[1] : null;
}