import { describe, expect, it } from 'vitest';

import { filterDriveFiles, type DriveFile } from './DriveFilesPanel';
import { filterUploads } from './UploadList';
import type { Upload } from '../types';

describe('knowledge source filters', () => {
  it('filters Drive sources by name and type', () => {
    const files: DriveFile[] = [
      { id: '1', name: 'בגרות 2025.pdf', mimeType: 'application/pdf', modifiedTime: null, sizeBytes: 100 },
      { id: '2', name: 'סיכום', mimeType: 'application/vnd.google-apps.document', modifiedTime: null, sizeBytes: null },
    ];
    expect(filterDriveFiles(files, 'בגרות', 'pdf')).toEqual([files[0]]);
  });

  it('filters personal uploads by processing status', () => {
    const uploads: Upload[] = [
      { id: '1', fileName: 'מוכן.pdf', fileSizeBytes: 10, mimeType: 'application/pdf', isProcessed: true, processingStatus: 'completed', createdAt: '2026-01-01' },
      { id: '2', fileName: 'ממתין.pdf', fileSizeBytes: 10, mimeType: 'application/pdf', isProcessed: false, processingStatus: 'pending', createdAt: '2026-01-01' },
    ];
    expect(filterUploads(uploads, '', 'completed')).toEqual([uploads[0]]);
  });
});
