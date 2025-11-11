import React, { useEffect, useState } from 'react';
import reportesService from '../../../services/reportesService';

const ReportesPage = () => {
  const [mensaje, setMensaje] = useState('Cargando...');
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const texto = await reportesService.getHello();
        if (mounted) setMensaje(texto);
      } catch (e) {
        console.error('[ReportesPage] Error obteniendo saludo:', e);
        if (mounted) {
          setError('No se pudo obtener el saludo de Reportes');
          setMensaje('Hola Mundo Reportes');
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="dashboard-content">
      <h2>Reportes</h2>
      {error && (
        <p style={{ color: 'red', marginTop: 8 }}>{error}</p>
      )}
      <p style={{ fontSize: 18, marginTop: 12 }}>{mensaje}</p>
    </div>
  );
};

export default ReportesPage;