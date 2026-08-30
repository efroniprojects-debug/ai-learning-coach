import { google, type drive_v3 } from 'googleapis';
import { eq } from 'drizzle-orm';

import { db, knowledgeChunks } from '@/db';
import { ChunkingService } from '@/services/chunking.service';

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  sizeBytes: number | null;
}

export interface DriveSyncResult {
  filesScanned: number;
  filesIndexed: number;
  chunksCreated: number;
  skipped: Array<{ name: string; reason: string }>;
  syncedAt: string;
}

export class DriveService {
  private static lastSyncAt: string | null = null;

  static isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_FOLDER_ID);
  }

  static getLastSyncAt(): string | null {
    return this.lastSyncAt;
  }

  private static getClient(): drive_v3.Drive {
    const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!rawCredentials) throw new Error('GOOGLE_DRIVE_NOT_CONFIGURED');

    let credentials: Record<string, string>;
    try {
      credentials = JSON.parse(rawCredentials) as Record<string, string>;
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_INVALID');
    }

    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({ credentials, scopes: DRIVE_SCOPES });
    return google.drive({ version: 'v3', auth });
  }

  static async listFiles(): Promise<DriveFileSummary[]> {
    if (!this.isConfigured()) return [];
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID as string;
    const drive = this.getClient();
    const result = await drive.files.list({
      q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,modifiedTime,size)',
      orderBy: 'modifiedTime desc',
      pageSize: 100,
    });

    return (result.data.files ?? [])
      .filter((file): file is drive_v3.Schema$File & { id: string; name: string; mimeType: string } =>
        Boolean(file.id && file.name && file.mimeType)
      )
      .map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime ?? null,
        sizeBytes: file.size ? Number(file.size) : null,
      }));
  }

  static async extractText(fileId: string, mimeType: string): Promise<string> {
    const drive = this.getClient();

    if (mimeType === 'application/vnd.google-apps.document') {
      const response = await drive.files.export(
        { fileId, mimeType: 'text/plain' },
        { responseType: 'text' }
      );
      return String(response.data);
    }

    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'text' }
      );
      return String(response.data);
    }

    if (mimeType === 'application/pdf') {
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      const bytes = Buffer.from(response.data as ArrayBuffer);
      return this.extractPdfWithGemini(bytes);
    }

    throw new Error(`UNSUPPORTED_DRIVE_MIME_TYPE:${mimeType}`);
  }

  private static async extractPdfWithGemini(pdf: Buffer): Promise<string> {
    const apiKey = process.env.DEMO_GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_KEY_REQUIRED_FOR_PDF');

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
        signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: 'חלץ את כל הטקסט הלימודי מה-PDF כפי שהוא. החזר טקסט בלבד.' },
              { inline_data: { mime_type: 'application/pdf', data: pdf.toString('base64') } },
            ],
          }],
        }),
      }
    );
    const data = await response.json() as {
      error?: { message?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    if (!response.ok) throw new Error(data.error?.message ?? `PDF_EXTRACTION_HTTP_${response.status}`);
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
    if (!text) throw new Error('PDF_EXTRACTION_EMPTY');
    return text;
  }

  static async syncFolder(): Promise<DriveSyncResult> {
    if (!this.isConfigured()) throw new Error('GOOGLE_DRIVE_NOT_CONFIGURED');
    const files = await this.listFiles();
    const result: DriveSyncResult = {
      filesScanned: files.length,
      filesIndexed: 0,
      chunksCreated: 0,
      skipped: [],
      syncedAt: new Date().toISOString(),
    };

    for (const file of files) {
      try {
        const text = await this.extractText(file.id, file.mimeType);
        const chunks = ChunkingService.chunkText(text);
        await db.delete(knowledgeChunks).where(eq(knowledgeChunks.sourceId, file.id));
        if (chunks.length > 0) {
          await db.insert(knowledgeChunks).values(chunks.map((chunk) => ({
            sourceType: 'google_drive',
            sourceId: file.id,
            chunkText: chunk.text,
            metadata: {
              sourceName: file.name,
              mimeType: file.mimeType,
              modifiedTime: file.modifiedTime,
              chunkIndex: chunk.metadata.chunkIndex,
              page: chunk.metadata.pageNumber,
            },
          })));
        }
        result.filesIndexed += 1;
        result.chunksCreated += chunks.length;
      } catch (error) {
        result.skipped.push({
          name: file.name,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.lastSyncAt = result.syncedAt;
    return result;
  }
}
