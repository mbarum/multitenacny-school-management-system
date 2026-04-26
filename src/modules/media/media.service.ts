import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

/**
 * @description Service for handling file uploads to persistent cloud storage.
 * It uses Google Cloud Storage as the primary provider.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private storage: Storage;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('GCS_PROJECT_ID');
    const keyFilename = this.configService.get<string>('GCS_KEY_FILE');
    this.bucketName = this.configService.get<string>('GCS_BUCKET');

    // Initialize storage client
    const storageOptions: any = {};
    if (projectId) storageOptions.projectId = projectId;
    if (keyFilename) storageOptions.keyFilename = keyFilename;

    try {
      this.storage = new Storage(storageOptions);
      if (this.bucketName) {
        this.logger.log(`Initialized GCS Storage with bucket: ${this.bucketName}`);
      } else {
        this.logger.warn('GCS_BUCKET is not defined. Uploads will fail unless bucket is provided at runtime.');
      }
    } catch (error) {
      this.logger.error('Failed to initialize GCS storage', error.stack);
    }
  }

  /**
   * Uploads a file to Google Cloud Storage.
   * @param file The file object from Multer
   * @param folder Optional folder name in the bucket
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    if (!this.bucketName) {
      throw new Error('Storage bucket not configured. Please set GCS_BUCKET environment variable.');
    }

    const bucket = this.storage.bucket(this.bucketName);
    const fileName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        this.logger.error(`Upload error: ${err.message}`);
        reject(err);
      });

      blobStream.on('finish', () => {
        // The public URL can be constructed based on the bucket and file name
        // For public buckets: https://storage.googleapis.com/[BUCKET_NAME]/[FILE_NAME]
        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
        this.logger.log(`File uploaded successfully: ${publicUrl}`);
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  /**
   * Uploads raw buffer to cloud storage (useful for generated PDFs/Excels).
   */
  async uploadBuffer(buffer: Buffer, fileName: string, contentType: string, folder: string = 'reports'): Promise<string> {
    if (!this.bucketName) {
      throw new Error('Storage bucket not configured.');
    }

    const bucket = this.storage.bucket(this.bucketName);
    const fullPath = `${folder}/${uuidv4()}_${fileName}`;
    const blob = bucket.file(fullPath);

    await blob.save(buffer, {
      contentType,
      resumable: false,
    });

    return `https://storage.googleapis.com/${this.bucketName}/${fullPath}`;
  }

  /**
   * Deletes a file from storage.
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const parts = fileUrl.split(`${this.bucketName}/`);
      if (parts.length < 2) return;
      
      const fileName = parts[1];
      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(fileName).delete();
      this.logger.log(`Deleted file: ${fileName}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file from storage: ${fileUrl}`, error.message);
    }
  }
}
