/**
 * Types et interfaces pour la gestion du stockage de fichiers
 * Permet une abstraction entre stockage local et cloud (S3, etc.)
 */

export type StorageProviderType = 'local' | 's3' | 'cloudinary';

export interface UploadOptions {
  /** Chemin relatif où stocker le fichier (ex: "products/2024/product-id") */
  path?: string;
  /** Nom du fichier (si non fourni, utilise le nom original) */
  filename?: string;
  /** Taille maximale en bytes (défaut: 10MB) */
  maxSize?: number;
  /** Types MIME autorisés */
  allowedMimeTypes?: string[];
}

export interface UploadResult {
  /** URL publique du fichier uploadé */
  url: string;
  /** Chemin complet du fichier (pour référence interne) */
  path: string;
  /** Nom du fichier */
  filename: string;
  /** Taille du fichier en bytes */
  size: number;
  /** Type MIME du fichier */
  mimeType: string;
}

export interface DeleteOptions {
  /** URL ou chemin du fichier à supprimer */
  url: string;
}

/**
 * Interface pour les providers de stockage
 * Implémentée par LocalStorageProvider, S3StorageProvider, etc.
 */
export interface StorageProvider {
  /**
   * Upload un fichier vers le stockage
   * @param file - Fichier à uploader (File ou Buffer)
   * @param options - Options d'upload
   * @returns Résultat avec URL et métadonnées
   */
  upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Supprime un fichier du stockage
   * @param options - Options de suppression
   */
  delete(options: DeleteOptions): Promise<void>;

  /**
   * Génère une URL publique pour un fichier
   * @param path - Chemin du fichier
   * @returns URL publique
   */
  getUrl(path: string): string;

  /**
   * Vérifie si un fichier existe
   * @param path - Chemin du fichier
   * @returns true si le fichier existe
   */
  exists(path: string): Promise<boolean>;
}

export interface StorageConfig {
  /** Type de provider à utiliser */
  provider: StorageProviderType;
  /** Configuration locale */
  local?: {
    uploadDir: string;
    publicPath: string;
  };
  /** Configuration S3 */
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
  /** Configuration Cloudinary */
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}
