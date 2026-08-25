import { db, uploadedFiles, knowledgeChunks } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];

export class UploadService {
  /**
   * Validate file before upload
   */
  static validateFile(fileName: string, mimeType: string, sizeBytes: number): void {
    // Check size
    const sizeMB = sizeBytes / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Check file name
    if (!fileName || fileName.length === 0) {
      throw new Error('File name is required');
    }
  }

  /**
   * Create upload record
   */
  static async createUpload(
    userId: string,
    fileName: string,
    mimeType: string,
    fileSizeBytes: number,
    storageUrl: string
  ) {
    const [uploaded] = await db
      .insert(uploadedFiles)
      .values({
        userId,
        fileName,
        mimeType,
        fileSizeBytes,
        storageUrl,
        isProcessed: false,
        processingStatus: 'pending',
      })
      .returning();

    return this.formatUploadResponse(uploaded);
  }

  /**
   * Update processing status
   */
  static async updateProcessingStatus(
    uploadId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    contentExtracted?: string
  ) {
    const [updated] = await db
      .update(uploadedFiles)
      .set({
        processingStatus: status,
        isProcessed: status === 'completed',
        contentExtracted,
      })
      .where(eq(uploadedFiles.id, uploadId))
      .returning();

    return updated;
  }

  /**
   * Get upload by ID
   */
  static async getUploadById(uploadId: string) {
    const upload = await db.query.uploadedFiles.findFirst({
      where: eq(uploadedFiles.id, uploadId),
    });

    if (!upload) {
      throw new Error('Upload not found');
    }

    return this.formatUploadResponse(upload);
  }

  /**
   * List user's uploads
   */
  static async listUserUploads(userId: string, limit: number = 20) {
    const uploads = await db.query.uploadedFiles.findMany({
      where: eq(uploadedFiles.userId, userId),
      orderBy: [desc(uploadedFiles.createdAt)],
      limit,
    });

    return uploads.map((u) => this.formatUploadResponse(u));
  }

  /**
   * Delete upload and associated chunks
   */
  static async deleteUpload(uploadId: string) {
    // Delete knowledge chunks first
    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.sourceDocumentId, uploadId));

    // Delete upload
    await db.delete(uploadedFiles).where(eq(uploadedFiles.id, uploadId));
  }

  /**
   * Format upload for response (no sensitive data)
   */
  private static formatUploadResponse(upload: any) {
    return {
      id: upload.id,
      fileName: upload.fileName,
      fileSizeBytes: upload.fileSizeBytes,
      mimeType: upload.mimeType,
      isProcessed: upload.isProcessed,
      processingStatus: upload.processingStatus,
      createdAt: upload.createdAt.toISOString(),
      // Don't return storageUrl (internal)
      // Don't return contentExtracted (used internally)
    };
  }
}
