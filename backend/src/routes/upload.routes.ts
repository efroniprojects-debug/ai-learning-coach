import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { UploadService } from '@/services/upload.service';
import { OCRService } from '@/services/ocr.service';
import { ChunkingService } from '@/services/chunking.service';
import { EmbeddingService } from '@/services/embedding.service';
import { db, knowledgeChunks } from '@/db';

const uploadFileSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSizeBytes: z.number().min(1, 'File size is required'),
  storageUrl: z.string().url('Invalid storage URL'),
});

export async function uploadRoutes(app: FastifyInstance) {
  // POST /api/v1/uploads/file
  app.post<{ Body: unknown }>(
    '/api/v1/uploads/file',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const body = uploadFileSchema.parse(request.body);

        // Validate file
        UploadService.validateFile(body.fileName, body.mimeType, body.fileSizeBytes);

        // Create upload record
        const upload = await UploadService.createUpload(
          request.user.userId,
          body.fileName,
          body.mimeType,
          body.fileSizeBytes,
          body.storageUrl
        );

        // TODO: Enqueue OCR job (async processing)
        // For now, just return upload status
        console.log(`[Upload] File queued for processing: ${upload.id}`);

        reply.status(200).send(upload);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }

        const message = error instanceof Error ? error.message : 'Upload failed';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/uploads
  app.get(
    '/api/v1/uploads',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const uploads = await UploadService.listUserUploads(request.user.userId);
        reply.status(200).send({ uploads });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list uploads';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/uploads/:uploadId
  app.get<{ Params: { uploadId: string } }>(
    '/api/v1/uploads/:uploadId',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const upload = await UploadService.getUploadById(request.params.uploadId);
        // TODO: Verify ownership (user can only see their own uploads)

        reply.status(200).send(upload);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch upload';
        reply.status(400).send({ error: message });
      }
    }
  );

  // DELETE /api/v1/uploads/:uploadId
  app.delete<{ Params: { uploadId: string } }>(
    '/api/v1/uploads/:uploadId',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        // TODO: Verify ownership
        await UploadService.deleteUpload(request.params.uploadId);

        reply.status(200).send({ success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete upload';
        reply.status(400).send({ error: message });
      }
    }
  );

  // POST /api/v1/uploads/process/:uploadId (for testing OCR pipeline)
  app.post<{ Params: { uploadId: string } }>(
    '/api/v1/uploads/process/:uploadId',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const uploadId = request.params.uploadId;

        // Simulate OCR pipeline
        await UploadService.updateProcessingStatus(uploadId, 'processing');

        // Step 1: Extract text (mock OCR)
        console.log('[Pipeline] Extracting text from file...');
        const extractedResult = await OCRService.extractText(
          'gs://bucket/file.pdf',
          'application/pdf'
        );

        // Step 2: Chunk text
        console.log('[Pipeline] Chunking text...');
        const chunks = ChunkingService.chunkText(extractedResult.text);
        console.log(`[Pipeline] Created ${chunks.length} chunks`);

        // Step 3: Generate embeddings
        console.log('[Pipeline] Generating embeddings...');
        const embeddings = await EmbeddingService.generateEmbeddingsBatch(
          chunks.map((c) => c.text)
        );

        // Step 4: Insert into knowledge_chunks table
        console.log('[Pipeline] Indexing chunks in database...');
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = embeddings[i];
          const concepts = ChunkingService.detectConcepts(chunk.text);

          await db.insert(knowledgeChunks).values({
            sourceType: 'custom',
            sourceId: uploadId,
            sourceDocumentId: uploadId,
            chunkText: chunk.text,
            chunkEmbedding: embedding,
            conceptIds: [],
            metadata: {
              chunkIndex: chunk.metadata.chunkIndex,
              section: chunk.metadata.section,
            },
          });
        }

        // Step 5: Mark upload as complete
        await UploadService.updateProcessingStatus(uploadId, 'completed', extractedResult.text);

        reply.status(200).send({
          success: true,
          chunksCreated: chunks.length,
          embeddingsGenerated: embeddings.length,
        });
      } catch (error) {
        if (request.params.uploadId) {
          await UploadService.updateProcessingStatus(request.params.uploadId, 'failed');
        }

        const message = error instanceof Error ? error.message : 'Processing failed';
        reply.status(400).send({ error: message });
      }
    }
  );
}
