import { StorageProvider, StorageProviderType, StorageConfig } from './types';
import { LocalStorageProvider } from './providers/local.provider';
import { S3StorageProvider } from './providers/s3.provider';
import { env } from '@/lib/core/env';

/**
 * Factory pour créer le bon provider de stockage selon la configuration
 */
export class StorageService {
  private static instance: StorageProvider;

  /**
   * Retourne l'instance singleton du provider de stockage configuré
   */
  static getProvider(): StorageProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  /**
   * Crée le provider de stockage selon la configuration
   */
  private static createProvider(): StorageProvider {
    const config = this.getConfig();

    switch (config.provider) {
      case 'local':
        return new LocalStorageProvider(
          config.local?.uploadDir || 'public/uploads',
          config.local?.publicPath || '/uploads'
        );

      case 's3':
        if (!config.s3) {
          throw new Error('S3 configuration is missing');
        }
        return new S3StorageProvider({
          bucket: config.s3.bucket,
          region: config.s3.region,
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
          endpoint: config.s3.endpoint,
        });

      case 'cloudinary':
        throw new Error('Cloudinary provider not yet implemented');

      default:
        throw new Error(`Unknown storage provider: ${config.provider}`);
    }
  }

  /**
   * Charge la configuration depuis les variables d'environnement
   */
  private static getConfig(): StorageConfig {
    const provider = env.STORAGE_PROVIDER;

    const config: StorageConfig = {
      provider,
    };

    // Configuration locale
    if (provider === 'local') {
      config.local = {
        uploadDir: env.STORAGE_LOCAL_UPLOAD_DIR,
        publicPath: env.STORAGE_LOCAL_PUBLIC_PATH,
      };
    }

    // Configuration S3
    if (provider === 's3') {
      config.s3 = {
        bucket: env.STORAGE_S3_BUCKET || '',
        region: env.STORAGE_S3_REGION || 'us-east-1',
        accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID || '',
        secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY || '',
        endpoint: env.STORAGE_S3_ENDPOINT,
      };
    }

    // Configuration Cloudinary
    if (provider === 'cloudinary') {
      config.cloudinary = {
        cloudName: env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: env.CLOUDINARY_API_KEY || '',
        apiSecret: env.CLOUDINARY_API_SECRET || '',
      };
    }

    return config;
  }

  /**
   * Réinitialise l'instance (utile pour les tests)
   */
  static resetInstance(): void {
    // @ts-expect-error - Reset needed for tests
    this.instance = undefined;
  }
}

/**
 * Helper pour obtenir rapidement le provider
 */
export const getStorageProvider = (): StorageProvider => {
  return StorageService.getProvider();
};
