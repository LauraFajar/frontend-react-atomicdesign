# Instrucciones para Backend - Reportes IoT

## Problema Identificado

El módulo de IoT tiene problemas con la exportación de reportes en PDF y Excel que contienen:
1. Gráficas históricas de todos los sensores
2. Las veces que se ha prendido la bomba en la semana o en el día
3. Información de cultivos y sublotes donde están asignados los sensores

## Endpoints Faltantes

### 1. Exportar Reporte IoT en PDF

**Endpoint:** `GET /sensores/reporte-iot/pdf`

**Parámetros de consulta:**
- `fecha_desde` (opcional): Fecha inicio en formato YYYY-MM-DD
- `fecha_hasta` (opcional): Fecha fin en formato YYYY-MM-DD
- `topic` (opcional): Tópico MQTT específico del sensor

**Respuesta esperada:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="reporte_iot_{fecha_desde}_{fecha_hasta}.pdf"`

**Datos a incluir en el PDF:**
```javascript
{
  titulo: "Reporte IoT",
  rango_fechas: { desde: "YYYY-MM-DD", hasta: "YYYY-MM-DD" },
  total_lecturas: number,
  total_sensores: number,
  datos_historicos: [
    {
      fecha_hora: "YYYY-MM-DD HH:mm:ss",
      valor: number,
      tipo_sensor: string,
      unidad: string
    }
  ],
  informacion_sensores: [
    {
      id: number,
      tipo_sensor: string,
      estado: string,
      valor_minimo: number,
      valor_maximo: number,
      unidad_medida: string,
      ubicacion: string,
      cultivo_asignado: string, // NUEVO CAMPO
      sublote_asignado: string  // NUEVO CAMPO
    }
  ],
  historial_bomba: [
    {
      fecha_hora: "YYYY-MM-DD HH:mm:ss",
      estado: string, // "ENCENDIDA" o "APAGADA"
      duracion_minutos: number  // NUEVO CAMPO
    }
  ],
  resumen_bomba: {
    activaciones_semana: number,
    activaciones_dia: number,
    tiempo_total_encendida_minutos: number
  }
}
```

### 2. Exportar Reporte IoT en Excel

**Endpoint:** `GET /sensores/reporte-iot/excel`

**Parámetros de consulta:**
- Mismos parámetros que el endpoint de PDF

**Respuesta esperada:**
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="reporte_iot_{fecha_desde}_{fecha_hasta}.xlsx"`

**Estructura del Excel:**
- **Hoja 1: "Datos Históricos"**
  - Columnas: Fecha y Hora | Valor | Tipo de Sensor | Unidad | Topic
  
- **Hoja 2: "Información Sensores"**
  - Columnas: ID | Tipo | Estado | Mínimo | Máximo | Unidad | Ubicación | Cultivo | Sublote
  
- **Hoja 3: "Historial Bomba"** (si hay datos)
  - Columnas: Fecha y Hora | Estado | Duración (min) | Tipo
  
- **Hoja 4: "Resumen"**
  - Total de lecturas | Total sensores | Activaciones bomba semana/día | Tiempo total bomba

## Cambios Requeridos en la Base de Datos

### Tabla de Sensores
Agregar campos para asignación a cultivos y sublotes:
```sql
ALTER TABLE sensores ADD COLUMN cultivo_id INT REFERENCES cultivos(id);
ALTER TABLE sensores ADD COLUMN sublote_id INT REFERENCES sublotes(id);
ALTER TABLE sensores ADD COLUMN topic_mqtt VARCHAR(255);
```

### Tabla de Historial Bomba
Crear tabla para tracking de activaciones de bomba:
```sql
CREATE TABLE historial_bomba (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sensor_id INT REFERENCES sensores(id),
  fecha_hora DATETIME NOT NULL,
  estado ENUM('ENCENDIDA', 'APAGADA') NOT NULL,
  duracion_minutos INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla de Lecturas de Sensores
Asegurar que incluya información de cultivos y sublotes:
```sql
ALTER TABLE lecturas_sensores ADD COLUMN cultivo_id INT REFERENCES cultivos(id);
ALTER TABLE lecturas_sensores ADD COLUMN sublote_id INT REFERENCES sublotes(id);
```

## Lógica de Negocio Requerida

### 1. Obtención de Datos Históricos
- Filtrar lecturas por rango de fechas
- Agrupar por tipo de sensor
- Incluir información de cultivo y sublote de cada lectura

### 2. Conteo de Activaciones de Bomba
- Contar transiciones de 'APAGADA' a 'ENCENDIDA'
- Agrupar por día y semana
- Calcular duración total de activaciones

### 3. Asignación de Sensores a Cultivos
- Si un sensor no tiene cultivo asignado, permitir asignación automática
- Mostrar ubicación del sublote en los reportes
- Incluir mapeo sensor -> cultivo -> sublote

## Generación de Archivos

### Para PDF:
Usar una librería como **jsPDF** o **Puppeteer** para generar PDFs con:
- Gráficos de líneas con Chart.js o similar
- Tablas formateadas
- Logo de la aplicación
- Fecha de generación

### Para Excel:
Usar **ExcelJS** para crear archivos con:
- Múltiples hojas
- Formato de celdas
- Gráficos embebidos
- Headers y filtros

## Ejemplo de Implementación

```javascript
// Controller ejemplo
const getIotReportPdf = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, topic } = req.query;
    
    // Obtener datos
    const datosHistoricos = await obtenerHistorialSensores({ fecha_desde, fecha_hasta, topic });
    const infoSensores = await obtenerInformacionSensores();
    const historialBomba = await obtenerHistorialBomba({ fecha_desde, fecha_hasta });
    const resumenBomba = await calcularResumenBomba({ fecha_desde, fecha_hasta });
    
    const reportData = {
      titulo: "Reporte IoT",
      rango_fechas: { desde: fecha_desde, hasta: fecha_hasta },
      total_lecturas: datosHistoricos.length,
      total_sensores: infoSensores.length,
      datos_historicos: datosHistoricos,
      informacion_sensores: infoSensores,
      historial_bomba: historialBomba,
      resumen_bomba: resumenBomba
    };
    
    // Generar PDF
    const pdfBuffer = await generarPdfIot(reportData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_iot_${fecha_desde}_${fecha_hasta}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando reporte PDF:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
```

## Pruebas Requeridas

1. **Prueba con datos vacíos:** Debe retornar 404 o mensaje apropiado
2. **Prueba con rango de fechas inválido:** Validación de parámetros
3. **Prueba con autenticación:** Solo usuarios autorizados
4. **Prueba de performance:** Archivos grandes no deben timeout
5. **Prueba de formato:** Verificar que los archivos se abran correctamente

## Notas Importantes

1. **Autenticación:** Los endpoints deben verificar tokens JWT
2. **Permisos:** Solo usuarios con rol 'administrador' o 'instructor'
3. **Logging:** Registrar todas las exportaciones para auditoría
4. **Límites:** Implementar límites en cantidad de datos por reporte
5. **Cache:** Considerar cache para reportes frecuentes

## Estados de Error a Manejar

- `400`: Parámetros inválidos
- `401`: No autenticado
- `403`: Sin permisos
- `404`: Sin datos en el rango
- `500`: Error interno del servidor
- `503`: Servicio temporalmente no disponible

Una vez implementados estos endpoints, las exportaciones de reportes IoT funcionarán correctamente tanto para PDF como Excel.