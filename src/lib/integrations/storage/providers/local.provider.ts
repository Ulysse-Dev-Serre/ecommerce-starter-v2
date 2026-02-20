import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import {
  StorageProvider,
  UploadOptions,
  UploadResult,
  DeleteOptions,
} from '../types';

/**
 * Provider de stockage local
 * Stocke les fichiers dans /public/uploads
 */
export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;
  private publicPath: string;

  constructor(
    uploadDir: string = 'public/uploads',
    publicPath: string = '/uploads'
  ) {
    this.uploadDir = uploadDir;
    this.publicPath = publicPath;
  }

  async upload(
    file: File | Buffer,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const {
      path: relativePath = 'general',
      filename,
      maxSize = 10 * 1024 * 1024, // 10MB par défaut
      allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
      ],
    } = options || {};

    // Convertir File en Buffer si nécessaire
    let buffer: Buffer;
    let originalFilename: string;
    let mimeType: string;

    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
      originalFilename = file.name;
      mimeType = file.type;
    } else {
      buffer = file;
      originalFilename = filename || 'file';
      mimeType = this.getMimeTypeFromFilename(originalFilename);
    }

    // Validation taille
    if (buffer.length > maxSize) {
      throw new Error(
        `File size (${buffer.length} bytes) exceeds maximum allowed size (${maxSize} bytes)`
      );
    }

    // Validation type MIME
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error(
        `File type ${mimeType} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

    // Générer un nom de fichier unique
    const ext = path.extname(originalFilename);
    const hash = crypto.randomBytes(16).toString('hex');
    const uniqueFilename = filename || `${Date.now()}-${hash}${ext}`;

    // Construire le chemin complet
    const fullPath = path.join(this.uploadDir, relativePath);
    const filePath = path.join(fullPath, uniqueFilename);

    // Créer les dossiers si nécessaire
    await fs.mkdir(fullPath, { recursive: true });

    // Écrire le fichier
    await fs.writeFile(filePath, buffer);

    // Construire l'URL publique
    const publicUrl = this.getUrl(path.join(relativePath, uniqueFilename));

    return {
      url: publicUrl,
      path: path.join(relativePath, uniqueFilename),
      filename: uniqueFilename,
      size: buffer.length,
      mimeType,
    };
  }

  async delete(options: DeleteOptions): Promise<void> {
    const { url } = options;

    // Extraire le chemin relatif depuis l'URL
    let relativePath: string;
    if (url.startsWith('http')) {
      // URL complète
      const urlObj = new URL(url);
      relativePath = urlObj.pathname.replace(this.publicPath, '');
    } else {
      // Chemin relatif ou URL relative
      relativePath = url.replace(this.publicPath, '');
    }

    const filePath = path.join(this.uploadDir, relativePath);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // Fichier déjà supprimé, on ignore
    }
  }

  getUrl(relativePath: string): string {
    return `${this.publicPath}/${relativePath.replace(/^\//, '')}`;
  }

  async exists(relativePath: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, relativePath);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Détermine le type MIME à partir de l'extension du fichier
   */
  private getMimeTypeFromFilename(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
