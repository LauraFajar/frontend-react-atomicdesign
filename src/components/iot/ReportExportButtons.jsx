import React from 'react';
import { Button, Box, Alert } from '@mui/material';
import { useAlert } from '../../contexts/AlertContext';
import sensoresService from '../../services/sensoresService';
import * as XLSX from 'xlsx';

const ReportExportButtons = ({
  topic,
  historialData = [],
  startDate,
  endDate,
  sensors = [],
  bombaData = [],
  selectedSensor = null,
}) => {
  const alert = useAlert();

  const fecha_desde = startDate?.toISOString?.() ? startDate.toISOString().split('T')[0] : undefined;
  const fecha_hasta = endDate?.toISOString?.() ? endDate.toISOString().split('T')[0] : undefined;

  const buildParams = () => {
    const params = {};
    if (fecha_desde) params.fecha_desde = fecha_desde;
    if (fecha_hasta) params.fecha_hasta = fecha_hasta;
    if (topic) {
      params.topic = topic;
    } else {
      // Si no hay topic, usar el topic por defecto
      params.topic = 'luixxa/dht11';
    }
    if (selectedSensor) params.metric = selectedSensor.tipo_sensor;
    return params;
  };

  // Calcular información del período para mostrar al usuario
  const getPeriodInfo = () => {
    if (!fecha_desde || !fecha_hasta) return null;

    const start = new Date(fecha_desde);
    const end = new Date(fecha_hasta);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const diffWeeks = Math.ceil(diffDays / 7);

    return {
      days: diffDays,
      weeks: diffWeeks,
      type: diffDays > 7 ? 'weekly' : 'detailed'
    };
  };

  const downloadBlobResponse = (response, filename) => {
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const generateLocalPDF = () => {
    const w = window.open('', '_blank');
    const title = selectedSensor ?
      `Reporte IoT - ${selectedSensor.tipo_sensor} (${selectedSensor.ubicacion || 'Ubicación N/A'})` :
      'Reporte IoT - Todos los Sensores';
s
    const chartData = historialData.map(item => {
      const fecha = item.fecha || item.timestamp || item.ts || item.date || item.created_at;
      const valor = item.valor || item.value || item.temperaturaAmbiente || item.humedadAmbiente || item.humedadSuelo || item.temp || item.humidity || 0;
      const tipo = item.tipo_sensor || item.tipo || item.metric || 'sensor';

      return {
        fecha: fecha ? new Date(fecha) : new Date(),
        valor: Number(valor) || 0,
        tipo: String(tipo),
        unidad: item.unidad || item.unit || ''
      };
    }).filter(item => !isNaN(item.fecha.getTime()));

    // Crear datos agrupados por tipo de sensor
    const sensoresPorTipo = {};
    chartData.forEach(item => {
      if (!sensoresPorTipo[item.tipo]) {
        sensoresPorTipo[item.tipo] = [];
      }
      sensoresPorTipo[item.tipo].push(item);
    });

    // Si hay un sensor seleccionado, filtrar los datos
    const datosParaGrafica = selectedSensor ?
      chartData.filter(item => {
        const selectedTipo = selectedSensor.tipo_sensor.toLowerCase();
        const itemTipo = item.tipo.toLowerCase();

        if (selectedTipo.includes('temperatura')) {
          return itemTipo.includes('temperatura');
        } else if (selectedTipo.includes('humedad') && selectedTipo.includes('aire')) {
          return itemTipo.includes('humedad') && itemTipo.includes('aire');
        } else if (selectedTipo.includes('humedad') && selectedTipo.includes('suelo')) {
          return itemTipo.includes('humedad') && itemTipo.includes('suelo');
        }
        return true;
      }) : chartData;

    const rows = chartData.map(i => {
      const fecha = i.fecha.toLocaleString('es-ES');
      return `<tr><td>${fecha}</td><td>${i.valor.toFixed(2)}</td><td>${i.tipo}</td><td>${i.unidad}</td></tr>`;
    }).join('');

    // Información de sensores y cultivos
    const sensorInfo = sensors.map(sensor =>
      `<tr>
        <td>${sensor.id}</td>
        <td>${sensor.tipo_sensor}</td>
        <td>${sensor.ubicacion || 'No asignado'}</td>
        <td>${sensor.estado}</td>
        <td>${sensor.valor_minimo} - ${sensor.valor_maximo}</td>
        <td>${sensor.unidad_medida}</td>
      </tr>`
    ).join('');

    // Información de activaciones de bomba
    const bombaInfo = bombaData.slice(0, 20).map(bomba =>
      `<tr><td>${new Date(bomba.fecha).toLocaleString('es-ES')}</td><td>${bomba.estado}</td></tr>`
    ).join('');

    let chartConfigs;
    if (selectedSensor) {
      const datosSensor = datosParaGrafica.slice(-50);
      chartConfigs = [{
        tipo: selectedSensor.tipo_sensor,
        color: '#2196f3',
        data: datosSensor.map(item => ({
          x: item.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          y: item.valor
        })),
        canvasId: `chart_${selectedSensor.tipo_sensor.replace(/\s+/g, '_')}`
      }];
    } else {
      chartConfigs = Object.entries(sensoresPorTipo).map(([tipo, datos], index) => {
        const colors = ['#ff6b35', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];
        const color = colors[index % colors.length];

        const chartData = datos.slice(-50).map(item => ({
          x: item.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          y: item.valor
        }));

        return {
          tipo,
          color,
          data: chartData,
          canvasId: `chart_${tipo.replace(/\s+/g, '_')}`
        };
      });
    }

    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #2e7d32; text-align: center; margin-bottom: 30px; }
            h2 { color: #1976d2; margin-top: 40px; margin-bottom: 15px; border-bottom: 2px solid #1976d2; padding-bottom: 5px; }
            h3 { color: #388e3c; margin-top: 25px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 25px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #1976d2; }
            .chart-container { margin: 30px 0; padding: 20px; background: #fafafa; border-radius: 8px; }
            .chart-canvas { max-width: 100%; height: 300px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
            .stat-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .stat-value { font-size: 24px; font-weight: bold; color: #2e7d32; }
            .stat-label { color: #666; font-size: 14px; }
            .page-break { page-break-before: always; }
            @media print {
              .chart-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>🌱 ${title}</h1>

          <div class="summary">
            <h2>📊 Resumen Ejecutivo</h2>
            ${selectedSensor ? `
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4caf50;">
              <h3 style="margin: 0 0 10px 0; color: #2e7d32;">🎯 Sensor Seleccionado</h3>
              <p style="margin: 5px 0;"><strong>Tipo:</strong> ${selectedSensor.tipo_sensor}</p>
              <p style="margin: 5px 0;"><strong>Ubicación:</strong> ${selectedSensor.ubicacion || 'No asignada'}</p>
              <p style="margin: 5px 0;"><strong>Estado:</strong> ${selectedSensor.estado}</p>
              <p style="margin: 5px 0;"><strong>Rango:</strong> ${selectedSensor.valor_minimo} - ${selectedSensor.valor_maximo} ${selectedSensor.unidad_medida}</p>
            </div>
            ` : ''}
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${chartData.length}</div>
                <div class="stat-label">${selectedSensor ? 'Lecturas del Sensor' : 'Total de Lecturas'}</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${sensors.length}</div>
                <div class="stat-label">${selectedSensor ? 'Sensor(es) Incluido(s)' : 'Sensores Activos'}</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${Object.keys(sensoresPorTipo).length}</div>
                <div class="stat-label">${selectedSensor ? 'Métrica(s) del Sensor' : 'Tipos de Sensores'}</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${bombaData.length}</div>
                <div class="stat-label">Eventos de Bomba</div>
              </div>
            </div>
            <p><strong>📅 Rango de fechas:</strong> ${fecha_desde || 'No especificada'} a ${fecha_hasta || 'No especificada'}</p>
            <p><strong>📡 Tópico MQTT:</strong> ${topic || 'Todos los sensores'}</p>
            <p><strong>⏰ Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>

          <div class="page-break">
            <h2>📈 Gráficas Históricas por Sensor</h2>
            ${chartConfigs.map(config => `
              <div class="chart-container">
                <h3>${config.tipo} (${sensors.find(s => s.tipo_sensor === config.tipo)?.unidad_medida || 'unidades'})</h3>
                <canvas id="${config.canvasId}" class="chart-canvas"></canvas>
              </div>
            `).join('')}
          </div>

          <div class="page-break">
            <h2>📋 Datos Históricos Detallados</h2>
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Valor</th>
                  <th>Tipo de Sensor</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>

          <div class="page-break">
            <h2>🔧 Información de Sensores</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo de Sensor</th>
                  <th>Ubicación/Cultivo</th>
                  <th>Estado</th>
                  <th>Rango Operativo</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>${sensorInfo}</tbody>
            </table>
          </div>

          ${bombaData.length > 0 ? `
          <div class="page-break">
            <h2>💧 Historial de Activación de Bomba</h2>
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>${bombaInfo}</tbody>
            </table>

            <h3>📊 Estadísticas de Bomba</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${bombaData.filter(b => b.estado === 'ENCENDIDA').length}</div>
                <div class="stat-label">Activaciones Totales</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${bombaData.filter(b => {
                  const fecha = new Date(b.fecha);
                  const ahora = new Date();
                  const diferencia = ahora - fecha;
                  return diferencia <= 7 * 24 * 60 * 60 * 1000 && b.estado === 'ENCENDIDA';
                }).length}</div>
                <div class="stat-label">Esta Semana</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${bombaData.filter(b => {
                  const fecha = new Date(b.fecha);
                  const ahora = new Date();
                  const diferencia = ahora - fecha;
                  return diferencia <= 24 * 60 * 60 * 1000 && b.estado === 'ENCENDIDA';
                }).length}</div>
                <div class="stat-label">Hoy</div>
              </div>
            </div>
          </div>
          ` : ''}

          <script>
            // Generar gráficas con Chart.js
            ${chartConfigs.map(config => `
              const ctx_${config.canvasId} = document.getElementById('${config.canvasId}').getContext('2d');
              new Chart(ctx_${config.canvasId}, {
                type: 'line',
                data: {
                  labels: ${JSON.stringify(config.data.map(d => d.x))},
                  datasets: [{
                    label: '${config.tipo}',
                    data: ${JSON.stringify(config.data.map(d => d.y))},
                    borderColor: '${config.color}',
                    backgroundColor: '${config.color}20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Evolución de ${config.tipo}'
                    },
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Tiempo'
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Valor'
                      }
                    }
                  }
                }
              });
            `).join('')}

            // Auto-imprimir después de cargar
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
  };

  const generateLocalExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const chartData = historialData.map(item => {
        const fecha = item.fecha || item.timestamp || item.ts || item.date || item.created_at;
        const valor = item.valor || item.value || item.temperaturaAmbiente || item.humedadAmbiente || item.humedadSuelo || item.temp || item.humidity || 0;
        const tipo = item.tipo_sensor || item.tipo || item.metric || 'sensor';
        const unidad = item.unidad || item.unit || '';

        return {
          'Fecha y Hora': fecha ? new Date(fecha).toLocaleString('es-ES') : 'N/A',
          'Valor': Number(valor) || 0,
          'Tipo de Sensor': String(tipo),
          'Unidad': unidad,
          'Tópico': item.topic || topic || 'N/A',
          'Métrica': item.metric || 'N/A'
        };
      }).filter(item => item['Fecha y Hora'] !== 'N/A');

      // Filtrar datos si hay un sensor seleccionado
      const datosParaReporte = selectedSensor ?
        chartData.filter(item => {
          const selectedTipo = selectedSensor.tipo_sensor.toLowerCase();
          const itemTipo = item['Tipo de Sensor'].toLowerCase();

          if (selectedTipo.includes('temperatura')) {
            return itemTipo.includes('temperatura');
          } else if (selectedTipo.includes('humedad') && selectedTipo.includes('aire')) {
            return itemTipo.includes('humedad') && itemTipo.includes('aire');
          } else if (selectedTipo.includes('humedad') && selectedTipo.includes('suelo')) {
            return itemTipo.includes('humedad') && itemTipo.includes('suelo');
          }
          return true;
        }) : chartData;

      const ws1 = XLSX.utils.json_to_sheet(datosParaReporte);
      XLSX.utils.book_append_sheet(wb, ws1, selectedSensor ? `Datos ${selectedSensor.tipo_sensor}` : 'Datos Históricos');

      const sensorInfo = sensors.map(sensor => ({
        'ID': sensor.id,
        'Tipo de Sensor': sensor.tipo_sensor,
        'Estado': sensor.estado,
        'Valor Mínimo': sensor.valor_minimo,
        'Valor Máximo': sensor.valor_maximo,
        'Unidad': sensor.unidad_medida,
        'Ubicación/Cultivo': sensor.ubicacion || 'No asignado',
        'Última Lectura': sensor.ultima_lectura || 'N/A'
      }));

      const ws2 = XLSX.utils.json_to_sheet(sensorInfo);
      XLSX.utils.book_append_sheet(wb, ws2, 'Información Sensores');

      if (bombaData.length > 0) {
        const bombaInfo = bombaData.map(bomba => ({
          'Fecha y Hora': new Date(bomba.fecha).toLocaleString('es-ES'),
          'Estado': bomba.estado,
          'Tipo': bomba.tipo || 'bomba',
          'Es Hoy': new Date(bomba.fecha).toDateString() === new Date().toDateString() ? 'Sí' : 'No',
          'Esta Semana': (() => {
            const fecha = new Date(bomba.fecha);
            const ahora = new Date();
            const diferencia = ahora - fecha;
            return diferencia <= 7 * 24 * 60 * 60 * 1000 ? 'Sí' : 'No';
          })()
        }));

        bombaInfo.push({
          'Fecha y Hora': 'RESUMEN',
          'Estado': '',
          'Tipo': '',
          'Es Hoy': '',
          'Esta Semana': ''
        });

        bombaInfo.push({
          'Fecha y Hora': 'Total Activaciones',
          'Estado': bombaData.filter(b => b.estado === 'ENCENDIDA').length,
          'Tipo': '',
          'Es Hoy': '',
          'Esta Semana': ''
        });

        bombaInfo.push({
          'Fecha y Hora': 'Activaciones esta semana',
          'Estado': bombaData.filter(b => {
            const fecha = new Date(b.fecha);
            const ahora = new Date();
            const diferencia = ahora - fecha;
            return diferencia <= 7 * 24 * 60 * 60 * 1000 && b.estado === 'ENCENDIDA';
          }).length,
          'Tipo': '',
          'Es Hoy': '',
          'Esta Semana': ''
        });

        bombaInfo.push({
          'Fecha y Hora': 'Activaciones hoy',
          'Estado': bombaData.filter(b => {
            const fecha = new Date(b.fecha);
            return fecha.toDateString() === new Date().toDateString() && b.estado === 'ENCENDIDA';
          }).length,
          'Tipo': '',
          'Es Hoy': '',
          'Esta Semana': ''
        });

        const ws3 = XLSX.utils.json_to_sheet(bombaInfo);
        XLSX.utils.book_append_sheet(wb, ws3, 'Historial Bomba');
      }

      const resumen = [
        { 'Métrica': selectedSensor ? `Lecturas de ${selectedSensor.tipo_sensor}` : 'Total de Lecturas Históricas', 'Valor': datosParaReporte.length },
        { 'Métrica': 'Total de Sensores', 'Valor': sensors.length },
        { 'Métrica': selectedSensor ? 'Sensor Seleccionado' : 'Tipos de Sensores Diferentes', 'Valor': selectedSensor ? selectedSensor.tipo_sensor : new Set(datosParaReporte.map(d => d['Tipo de Sensor'])).size },
        { 'Métrica': 'Eventos de Bomba', 'Valor': bombaData.length },
        { 'Métrica': 'Fecha Desde', 'Valor': fecha_desde || 'No especificada' },
        { 'Métrica': 'Fecha Hasta', 'Valor': fecha_hasta || 'No especificada' },
        { 'Métrica': 'Tópico MQTT', 'Valor': topic || 'Todos los sensores' },
        { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-ES') }
      ];

      const ws4 = XLSX.utils.json_to_sheet(resumen);
      XLSX.utils.book_append_sheet(wb, ws4, 'Resumen General');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const urlBlob = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `reporte_iot_${selectedSensor ? selectedSensor.tipo_sensor.replace(/\s+/g, '_') + '_' : ''}${fecha_desde || 'desde'}_${fecha_hasta || 'hasta'}.xlsx`;
      a.click();
      URL.revokeObjectURL(urlBlob);

      alert.success('Éxito', `Reporte Excel generado localmente${selectedSensor ? ` para ${selectedSensor.tipo_sensor}` : ''} con ${datosParaReporte.length} lecturas históricas`);
    } catch (error) {
      console.error('Error generando Excel local:', error);
      alert.error('Error', 'No se pudo generar el reporte Excel: ' + error.message);
    }
  };

  const onExportPdf = async () => {
    try {
      console.log('Iniciando exportación PDF con parámetros:', buildParams());
      const response = await sensoresService.exportIotPdf(buildParams());
      downloadBlobResponse(response, `reporte_iot_${selectedSensor ? selectedSensor.tipo_sensor.replace(/\s+/g, '_') + '_' : ''}${fecha_desde || 'desde'}_${fecha_hasta || 'hasta'}.pdf`);
      alert.success('Éxito', `Reporte PDF${selectedSensor ? ` de ${selectedSensor.tipo_sensor}` : ''} descargado correctamente`);
    } catch (error) {
      console.error('Error en exportación PDF:', error);
      const status = error?.response?.status;

      if (status === 404) {
        alert.warning('Sin datos', 'No se encontraron datos en el rango seleccionado');
      } else if (status === 401) {
        alert.error('Autenticación', 'Sesión expirada. Por favor, inicie sesión nuevamente');
      } else {
        if (historialData.length > 0 || sensors.length > 0) {
          generateLocalPDF();
          alert.info('Reporte local', 'Generando reporte PDF localmente debido a error del servidor');
        } else {
          alert.error('Error', 'No se pudo descargar el PDF y no hay datos suficientes para generar un reporte local');
        }
      }
    }
  };

  const onExportExcel = async () => {
    try {
      console.log('Iniciando exportación Excel con parámetros:', buildParams());
      const response = await sensoresService.exportIotExcel(buildParams());
      downloadBlobResponse(response, `reporte_iot_${selectedSensor ? selectedSensor.tipo_sensor.replace(/\s+/g, '_') + '_' : ''}${fecha_desde || 'desde'}_${fecha_hasta || 'hasta'}.xlsx`);
      alert.success('Éxito', `Reporte Excel${selectedSensor ? ` de ${selectedSensor.tipo_sensor}` : ''} descargado correctamente`);
    } catch (error) {
      console.error('Error en exportación Excel:', error);
      const status = error?.response?.status;

      if (status === 404) {
        alert.warning('Sin datos', 'No se encontraron datos en el rango seleccionado');
      } else if (status === 401) {
        alert.error('Autenticación', 'Sesión expirada. Por favor, inicie sesión nuevamente');
      } else {
        if (historialData.length > 0 || sensors.length > 0) {
          generateLocalExcel();
        } else {
          alert.error('Error', 'No se pudo descargar el Excel y no hay datos suficientes para generar un reporte local');
        }
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Button
        variant="contained"
        color="success"
        onClick={onExportExcel}
        size="small"
      >
        📊 Descargar Excel
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={onExportPdf}
        size="small"
      >
        📄 Descargar PDF
      </Button>

      {/* Mostrar información sobre los datos disponibles */}
      {(historialData.length === 0 && sensors.length === 0) && (
        <Alert severity="info" sx={{ mt: 1, width: '100%' }}>
          No hay datos disponibles para exportar en el rango seleccionado.
        </Alert>
      )}

      {/* Mostrar información sobre el tipo de reporte */}
      {(() => {
        const periodInfo = getPeriodInfo();
        if (periodInfo) {
          const reportType = periodInfo.type === 'weekly' ?
            `📊 Reporte Semanal (${periodInfo.weeks} semanas)` :
            `📋 Reporte Detallado (${periodInfo.days} días)`;

          return (
            <Alert severity="info" sx={{ mt: 1, width: '100%' }}>
              {reportType} - Incluye análisis de alertas y recomendaciones inteligentes
            </Alert>
          );
        }
        return null;
      })()}
    </Box>
  );
};

export default ReportExportButtons;