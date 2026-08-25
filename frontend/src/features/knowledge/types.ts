export interface Upload {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  isProcessed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface SearchResult {
  id: string;
  text: string;
  source: string;
  metadata?: {
    pageNumber?: number;
    section?: string;
    chunkIndex?: number;
  };
}
