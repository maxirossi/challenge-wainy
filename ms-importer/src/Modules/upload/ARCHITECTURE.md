# 🏗️ Arquitectura del Módulo Upload

## 📋 Resumen Ejecutivo

El módulo de upload está diseñado para procesar archivos BCRA de gran tamaño (hasta 10GB) de manera eficiente y escalable, utilizando streaming, procesamiento por chunks y almacenamiento distribuido.

## 🎯 Objetivos de Diseño

### Performance
- **Procesamiento de archivos de 5GB+**: Streaming real sin cargar en memoria
- **Velocidad**: Procesamiento de 100K+ líneas por segundo
- **Eficiencia**: Uso mínimo de memoria (<100MB independiente del tamaño del archivo)

### Escalabilidad
- **Horizontal**: Múltiples instancias pueden procesar archivos simultáneamente
- **Vertical**: Optimización para archivos de cualquier tamaño
- **Elástica**: Adaptación automática a la carga

### Resiliencia
- **Fault tolerance**: Continuación ante errores de línea individual
- **Recovery**: Recuperación de importaciones interrumpidas
- **Audit trail**: Trazabilidad completa de todas las operaciones

## 🏛️ Arquitectura de Alto Nivel

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTTP Client   │───▶│  Upload Module  │───▶│   DynamoDB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   LocalStack    │
                       │   (S3 + SQS)    │
                       └─────────────────┘
```

## 🔧 Componentes Principales

### 1. UploadController
**Responsabilidad**: Manejo de requests HTTP y validación de archivos

**Características**:
- Validación de tipo de archivo (.txt)
- Límite de tamaño (10GB)
- Interceptación de archivos multipart
- Documentación Swagger automática

**Flujo**:
```typescript
@Post('/upload')
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // 1. Validar archivo
  // 2. Delegar a UploadService
  // 3. Retornar respuesta
}
```

### 2. UploadService
**Responsabilidad**: Orquestación del proceso de importación

**Características**:
- Coordinación de todos los servicios
- Manejo de estado de importación
- Gestión de errores y recuperación
- Métricas de rendimiento

**Flujo Principal**:
```typescript
async processFile(file: any): Promise<UploadResult> {
  // 1. Crear registro de importación
  // 2. Subir archivo a S3 (streaming)
  // 3. Procesar archivo (streaming)
  // 4. Actualizar estadísticas
  // 5. Retornar resultado
}
```

### 3. S3Service
**Responsabilidad**: Almacenamiento de archivos en S3

**Características**:
- Upload multiparte para archivos grandes
- Streaming directo sin buffer intermedio
- Configuración optimizada para LocalStack
- Manejo de errores de red

**Implementación**:
```typescript
async uploadFileStream(stream: Readable, key: string): Promise<void> {
  const upload = new Upload({
    client: this.s3Client,
    params: { Bucket: this.bucketName, Key: key, Body: stream },
    queueSize: 4,        // 4 partes concurrentes
    partSize: 5 * 1024 * 1024, // 5MB por parte
  });
  await upload.done();
}
```

### 4. BcraLineParser
**Responsabilidad**: Parsing y validación de líneas BCRA

**Características**:
- Parsing de longitud fija (41 caracteres)
- Validación de tipos de datos
- Manejo de líneas incompletas
- Logging de errores detallado

**Estructura de Parsing**:
```typescript
parseLine(line: string): BcraLineData | null {
  // Validar longitud mínima
  if (line.length < 41) return null;
  
  // Extraer campos por posición
  return {
    codigoEntidad: line.substring(0, 5),
    fechaInformacion: line.substring(5, 11),
    // ... otros campos
  };
}
```

### 5. Repositorios DynamoDB

#### ImportacionRepository
**Responsabilidad**: Gestión de registros de importación

**Operaciones**:
- `crear()`: Nuevo registro de importación
- `actualizarEstadisticas()`: Actualizar contadores y estado
- `obtenerPorId()`: Consultar importación específica

#### DeudorImportadoRepository
**Responsabilidad**: Almacenamiento de datos de deudores

**Operaciones**:
- `crear()`: Guardar deudor importado
- `obtenerPorCuit()`: Consultar por CUIT
- `obtenerPorImportacion()`: Listar por importación (GSI)

#### ErrorImportacionRepository
**Responsabilidad**: Log de errores de importación

**Operaciones**:
- `crear()`: Registrar error de línea
- `obtenerPorImportacion()`: Listar errores por importación (GSI)

## 🔄 Flujo de Datos Detallado

### 1. Recepción de Archivo
```
HTTP Request → Multer → FileInterceptor → UploadController
```

### 2. Inicialización
```
UploadController → UploadService → ImportacionRepository.crear()
```

### 3. Upload a S3
```
File Stream → S3Service.uploadFileStream() → LocalStack S3
```

### 4. Procesamiento por Streaming
```
File Stream → Transform Stream → Line Processing → DynamoDB
```

### 5. Finalización
```
UploadService → ImportacionRepository.actualizarEstadisticas() → Response
```

## 📊 Modelo de Datos

### Tabla: importaciones_bcra
```typescript
interface Importacion {
  id: string;                    // PK - UUID
  nombreArchivo: string;         // Nombre original
  fechaImportacion: string;      // ISO timestamp
  estado: 'en_proceso' | 'completado' | 'error';
  cantidadRegistros: number;     // Líneas exitosas
  cantidadErrores: number;       // Líneas con error
  s3Key: string;                 // Ubicación S3
  tamanoArchivo: number;         // Bytes
  tipoArchivo: string;           // MIME type
}
```

### Tabla: deudores_bcra
```typescript
interface DeudorImportado {
  cuit: string;                  // PK - CUIT
  importacionId: string;         // GSI - Referencia
  // Campos del archivo BCRA
  codigoEntidad: string;
  fechaInformacion: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  actividad: string;
  situacion: number;
  prestamosGarantias: number;
  // Metadatos
  fechaImportacion: string;
  lineaArchivo: number;
}
```

### Tabla: importaciones_errores
```typescript
interface ErrorImportacion {
  id: string;                    // PK - UUID
  importacionId: string;         // GSI - Referencia
  linea: number;                 // Número de línea
  error: string;                 // Descripción
  contenidoLinea?: string;       // Contenido problemático
  timestamp: string;             // ISO timestamp
  tipoError: 'parsing' | 'validacion' | 'persistencia' | 'otro';
}
```

## 🔧 Optimizaciones Implementadas

### 1. Streaming de Archivos
```typescript
// Procesamiento línea por línea sin cargar en memoria
const lineProcessor = new Transform({
  transform: async (chunk: Buffer, encoding: string, callback: Function) => {
    // Procesar chunk de 64KB
    // Extraer líneas completas
    // Procesar cada línea
    callback();
  }
});
```

### 2. Upload Multiparte a S3
```typescript
const upload = new Upload({
  client: this.s3Client,
  params: { Bucket: this.bucketName, Key: key, Body: stream },
  queueSize: 4,        // Concurrencia
  partSize: 5 * 1024 * 1024, // Tamaño de parte
});
```

### 3. Buffering Inteligente
```typescript
// Manejo de líneas incompletas entre chunks
let buffer = '';
const lines = buffer.split('\n');
buffer = lines.pop() || ''; // Mantener línea incompleta
```

### 4. Procesamiento Asíncrono
```typescript
// Operaciones de base de datos no bloqueantes
await Promise.all([
  this.deudorImportadoRepository.crear(deudor),
  this.registerDeudorUseCase.execute(cuit, situacion, monto)
]);
```

## 🚨 Manejo de Errores

### Estrategia de Recuperación
1. **Errores de Línea Individual**: Continuar procesamiento
2. **Errores de Base de Datos**: Reintentar con backoff exponencial
3. **Errores de S3**: Fallback a almacenamiento local
4. **Errores Críticos**: Marcar importación como fallida

### Logging Estructurado
```typescript
this.logger.log('Archivo procesado', {
  importacionId,
  processedLines,
  cantidadErrores,
  tiempoProcesamiento,
  tamanoArchivo
});
```

## 📈 Métricas y Monitoreo

### Métricas Clave
- **Throughput**: Líneas procesadas por segundo
- **Latencia**: Tiempo total de procesamiento
- **Error Rate**: Porcentaje de líneas con error
- **Memory Usage**: Consumo de memoria durante procesamiento

### Alertas Recomendadas
- Error rate > 5%
- Processing time > 30 minutes para archivos < 1GB
- Memory usage > 200MB
- S3 upload failures > 3

## 🔮 Consideraciones Futuras

### Escalabilidad Horizontal
- **SQS Integration**: Cola de procesamiento para múltiples workers
- **Lambda Processing**: Procesamiento serverless para archivos muy grandes
- **Sharding**: División de archivos grandes en chunks procesables

### Optimizaciones Adicionales
- **Batch Writes**: Agrupación de operaciones DynamoDB
- **Connection Pooling**: Reutilización de conexiones
- **Caching**: Cache de configuraciones y validaciones
- **Compression**: Compresión de archivos antes del upload

### Monitoreo Avanzado
- **Distributed Tracing**: Trazabilidad con Jaeger/Zipkin
- **Custom Metrics**: Métricas específicas del dominio
- **Health Checks**: Endpoints de salud del módulo
- **Performance Profiling**: Análisis detallado de bottlenecks 