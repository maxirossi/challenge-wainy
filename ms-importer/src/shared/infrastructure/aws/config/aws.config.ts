export interface AWSConfig {
  region: string;
  endpoint?: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  forcePathStyle?: boolean;
}

export class AWSConfigService {
  private static instance: AWSConfigService;
  private config: AWSConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): AWSConfigService {
    if (!AWSConfigService.instance) {
      AWSConfigService.instance = new AWSConfigService();
    }
    return AWSConfigService.instance;
  }

  private loadConfig(): AWSConfig {
    const isLocalStack = process.env.AWS_ENDPOINT || process.env.NODE_ENV === 'development';
    
    if (isLocalStack) {
      return {
        region: process.env.AWS_REGION || 'us-east-1',
        endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
        },
        forcePathStyle: true, // Necesario para LocalStack
      };
    }

    return {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    };
  }

  getConfig(): AWSConfig {
    return this.config;
  }

  isLocalStack(): boolean {
    return !!this.config.endpoint;
  }

  getRegion(): string {
    return this.config.region;
  }

  getEndpoint(): string | undefined {
    return this.config.endpoint;
  }
} 