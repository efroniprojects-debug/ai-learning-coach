import { google, type drive_v3 } from 'googleapis';
import { eq } from 'drizzle-orm';
import { Readable } from 'node:stream';

import { db, knowledgeChunks } from '@/db';
import { ChunkingService } from '@/services/chunking.service';

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

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
    return Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
      (process.env.GOOGLE_DRIVE_PHYSICS_EXAMS_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID)
    );
  }

  static getLastSyncAt(): string | null {
    return this.lastSyncAt;
  }

  static isWriteConfigured(): boolean {
    return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID);
  }

  static async saveConversationTranscript(input: {
    conversationId: string;
    title: string;
    question: string;
    explanation: string;
    steps: Array<{ number: number; title: string; content: string }>;
    hints: string[];
  }): Promise<void> {
    if (!this.isWriteConfigured()) return;
    const drive = this.getClient();
    const folderId = process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID as string;
    const safeTitle = input.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 100) || 'שיחה';
    const content = [
      `# ${input.title}`,
      '',
      `עודכן: ${new Date().toLocaleString('he-IL')}`,
      '',
      '## השאלה',
      input.question,
      '',
      '## הסבר',
      input.explanation,
      '',
      '## שלבי הפתרון',
      ...input.steps.map((step) => `### ${step.number}. ${step.title}\n\n${step.content}`),
      '',
      '## רמזים',
      ...input.hints.map((hint, index) => `${index + 1}. ${hint}`),
    ].join('\n');
    const media = { mimeType: 'text/markdown', body: Readable.from([content]) };
    const escapedId = input.conversationId.replace(/'/g, "\\'");
    const existing = await drive.files.list({
      q: `appProperties has { key='conversationId' and value='${escapedId}' } and trashed = false`,
      fields: 'files(id)',
      pageSize: 1,
    });
    const existingId = existing.data.files?.[0]?.id;
    if (existingId) {
      await drive.files.update({ fileId: existingId, requestBody: { name: `${safeTitle}.md` }, media });
    } else {
      await drive.files.create({
        requestBody: {
          name: `${safeTitle}.md`,
          parents: [folderId],
          appProperties: { conversationId: input.conversationId },
        },
        media,
        fields: 'id',
      });
    }
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
    const folderId = (
      process.env.GOOGLE_DRIVE_PHYSICS_EXAMS_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_FOLDER_ID
    ) as string;
    const drive = this.getClient();
    const discovered: drive_v3.Schema$File[] = [];
    const foldersToScan = [folderId];
    const visited = new Set<string>();

    while (foldersToScan.length > 0) {
      const currentFolder = foldersToScan.shift() as string;
      if (visited.has(currentFolder)) continue;
      visited.add(currentFolder);
      let pageToken: string | undefined;
      do {
        const result = await drive.files.list({
          q: `'${currentFolder.replace(/'/g, "\\'")}' in parents and trashed = false`,
          fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,size)',
          orderBy: 'modifiedTime desc',
          pageSize: 100,
          pageToken,
        });
        for (const file of result.data.files ?? []) {
          if (file.mimeType === 'application/vnd.google-apps.folder' && file.id) {
            foldersToScan.push(file.id);
          } else {
            discovered.push(file);
          }
        }
        pageToken = result.data.nextPageToken ?? undefined;
      } while (pageToken);
    }

    return discovered
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
