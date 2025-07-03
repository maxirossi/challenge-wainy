# 🏗️ Arquitectura del Sistema - Wayni Móvil Challenge

## 📊 Diagrama de Arquitectura General

```mermaid
graph TB
    %% Usuario
    User[👤 Usuario] --> Frontend[🟩 Frontend Next.js<br/>localhost:3001]
    
    %% Frontend
    Frontend --> API[🟪 Laravel API<br/>localhost:8000]
    Frontend --> Importer[🟦 NestJS Importer<br/>localhost:3000]
    
    %% Microservicios
    Importer --> S3[(🟫 S3 LocalStack<br/>deudores-bcra-bucket)]
    Importer --> DynamoDB[(🟫 DynamoDB LocalStack<br/>deudores_bcra)]
    Importer --> SQS[(🟫 SQS LocalStack<br/>deudores-import-queue)]
    
    %% API Laravel
    API --> MySQL[(🟨 MySQL<br/>localhost:3306)]
    API --> SQS
    
    %% LocalStack
    S3 --> LocalStack[🟫 LocalStack<br/>localhost:4566]
    DynamoDB --> LocalStack
    SQS --> LocalStack
    
    %% Estilos
    classDef frontend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef api fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    classDef importer fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef database fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    classDef aws fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#fff
    classDef user fill:#6b7280,stroke:#4b5563,stroke-width:2px,color:#fff
    
    class Frontend frontend
    class API api
    class Importer importer
    class MySQL database
    class S3,DynamoDB,SQS,LocalStack aws
    class User user
```

## 🔄 Flujo de Procesamiento de Archivos

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant I as NestJS Importer
    participant S3 as S3 LocalStack
    participant D as DynamoDB
    participant Q as SQS
    participant L as Laravel API
    participant M as MySQL
    
    U->>F: Sube archivo TXT
    F->>I: POST /upload
    I->>I: Log import start
    I->>S3: Upload archivo
    I->>I: Procesar línea por línea
    loop Para cada línea
        I->>D: Guardar deudor
        I->>Q: Enviar mensaje
    end
    I->>I: Log import complete
    I->>F: Respuesta con estadísticas
    
    Q->>L: Consumir mensajes SQS
    L->>M: Guardar en MySQL
    L->>L: Procesar deudores
```

## 🗄️ Modelo de Datos

### MySQL (Laravel API)
```mermaid
erDiagram
    DEUDORES {
        bigint id PK
        string cuit UK
        int situacion
        decimal monto
        string codigo_entidad
        date fecha_informacion
        string tipo_identificacion
        string actividad
        string importacion_id
        int linea_archivo
        timestamps created_at
        timestamps updated_at
    }
    
    ENTIDADES {
        bigint id PK
        string codigo UK
        string nombre
        timestamps created_at
        timestamps updated_at
    }
    
    IMPORTACIONES {
        bigint id PK
        string nombre_archivo
        string s3_key
        text contenido_archivo
        bigint tamano_archivo
        string tipo_archivo
        int lineas_procesadas
        int cantidad_errores
        string estado
        timestamps created_at
        timestamps updated_at
    }
    
    DEUDORES ||--o{ IMPORTACIONES : "pertenece_a"
    DEUDORES ||--o{ ENTIDADES : "tiene_entidad"
```

### DynamoDB (NestJS Importer)
```mermaid
erDiagram
    DEUDORES_IMPORTADOS {
        string cuit PK
        string importacion_id
        string codigo_entidad
        string fecha_informacion
        string tipo_identificacion
        string numero_identificacion
        string actividad
        int situacion
        decimal prestamos_garantias
        int linea_archivo
    }
    
    ERRORES_IMPORTACION {
        string importacion_id PK
        int linea
        string error
        text contenido_linea
        string tipo_error
    }
    
    IMPORTACIONES_DYNAMO {
        string id PK
        string nombre_archivo
        string s3_key
        bigint tamano_archivo
        string tipo_archivo
        int lineas_procesadas
        int cantidad_errores
        string estado
    }
    
    DEUDORES_IMPORTADOS ||--o{ ERRORES_IMPORTACION : "puede_tener"
    DEUDORES_IMPORTADOS ||--o{ IMPORTACIONES_DYNAMO : "pertenece_a"
```

## 🌐 Endpoints y Rutas

### Frontend (Next.js)
```mermaid
graph LR
    Home[🏠 Home<br/>/] --> Upload[📤 Upload]
    Deudores[👥 Deudores<br/>/deudores] --> List[📋 Lista Paginada]
    About[🔍 Buscar CUIT<br/>/about] --> Search[🔎 Búsqueda]
    Top[🏆 Top Deudores<br/>/top] --> Ranking[📊 Ranking]
    Entidades[🏦 Entidades<br/>/entidades] --> Entity[🏛️ Info Entidad]
    Stats[📈 Estadísticas<br/>/stats] --> Dashboard[📊 Dashboard]
    
    classDef page fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    class Home,Deudores,About,Top,Entidades,Stats page
```



## 🔧 Configuración de Servicios

### Docker Compose
```mermaid
graph LR
    subgraph "Docker Compose"
        MySQL[(🟨 MySQL<br/>3306)]
        LocalStack[🟫 LocalStack<br/>4566]
        Importer[🟦 ms-importer<br/>3000]
        API[🟪 ms-api<br/>8000]
        Frontend[🟩 frontend<br/>3001]
    end
    
    MySQL --> API
    LocalStack --> Importer
    LocalStack --> API
    API --> Frontend
    Importer --> Frontend
    
    classDef service fill:#6b7280,stroke:#4b5563,stroke-width:2px,color:#fff
    class MySQL,LocalStack,Importer,API,Frontend service
```

## 🚀 Tecnologías Utilizadas

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes
- **React Hook Form** - Formularios

### Backend
- **Laravel 11** - API REST (ms-api)
- **NestJS** - Microservicio importer
- **PHP 8.2** - Laravel
- **Node.js 20** - NestJS
- **TypeScript** - NestJS

### Bases de Datos
- **MySQL 8.4** - Datos relacionales
- **DynamoDB** - Datos NoSQL (LocalStack)

### Infraestructura
- **Docker** - Contenedores
- **Docker Compose** - Orquestación
- **LocalStack** - Servicios AWS simulados
- **S3** - Almacenamiento archivos
- **SQS** - Colas de mensajes

### Herramientas
- **Git** - Control de versiones
- **GitHub** - Repositorio
- **ESLint** - Linting
- **Prettier** - Formateo
- **Swagger** - Documentación API

## 🔒 Seguridad y Configuración

```mermaid
graph TB
    subgraph "Configuración de Seguridad"
        EnvFiles[📄 .env files]
        DockerSecrets[🔐 Docker Secrets]
        AWSCreds[🔑 AWS Credentials]
        
        EnvFiles --> Importer[🟦 ms-importer]
        EnvFiles --> API[🟪 ms-api]
        EnvFiles --> Frontend[🟩 frontend]
        
        DockerSecrets --> MySQL[(🟨 MySQL)]
        AWSCreds --> LocalStack[🟫 LocalStack]
    end
    
    classDef config fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#fff
    class EnvFiles,DockerSecrets,AWSCreds config
```

---

*Diagramas generados con Mermaid - Arquitectura del sistema Wayni Móvil Challenge* 