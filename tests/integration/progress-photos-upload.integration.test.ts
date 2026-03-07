/**
 * P1.1 — Integration tests for progress photo upload (multipart) and GET file.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

// Minimal valid 1x1 pixel JPEG (134 bytes)
const MINIMAL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQADAPwA/9k=',
  'base64'
);

function buildMultipartBody(fields: Record<string, string>, file: { buffer: Buffer; filename: string; mime: string }): { body: Buffer; contentType: string } {
  const boundary = '----TestBoundary' + Date.now();
  const crlf = '\r\n';
  const parts: Buffer[] = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}${crlf}Content-Disposition: form-data; name="${name}"${crlf}${crlf}${value}${crlf}`,
      'utf8'
    ));
  }
  parts.push(Buffer.from(
    `--${boundary}${crlf}Content-Disposition: form-data; name="file"; filename="${file.filename}"${crlf}Content-Type: ${file.mime}${crlf}${crlf}`,
    'utf8'
  ));
  parts.push(file.buffer);
  parts.push(Buffer.from(crlf + '--' + boundary + '--' + crlf, 'utf8'));
  return {
    body: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

describe('Integration: Progress photos upload (P1.1)', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let patientId: string;
  let photoId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: { fullName: `Upload Test Patient ${Date.now()}`, email: `upload-${Date.now()}@test.com` },
    });
    patientId = res.json().id;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /v1/progress-photos/upload with file → 201 and returns imageUrl /file', async () => {
    const takenAt = new Date().toISOString().split('T')[0];
    const { body, contentType } = buildMultipartBody(
      { patientId, takenAt },
      { buffer: MINIMAL_JPEG, filename: 'test.jpg', mime: 'image/jpeg' }
    );
    const res = await app.inject({
      method: 'POST',
      url: '/v1/progress-photos/upload',
      headers: {
        ...authHeaders(ownerToken, tenantId),
        'content-type': contentType,
      },
      payload: body,
    });
    expect(res.statusCode).toBe(201);
    const json = res.json();
    expect(json.id).toBeDefined();
    expect(json.patientId).toBe(patientId);
    expect(json.imageUrl).toMatch(/^\/v1\/progress-photos\/[^/]+\/file$/);
    photoId = json.id;
  });

  it('GET /v1/progress-photos/:id/file returns image bytes', async () => {
    if (!photoId) return;
    const res = await app.inject({
      method: 'GET',
      url: `/v1/progress-photos/${photoId}/file`,
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/jpeg/);
    expect(Buffer.isBuffer(res.rawPayload) ? res.rawPayload.length : 0).toBeGreaterThan(0);
  });

  it('POST /v1/progress-photos/upload without file → 400', async () => {
    const takenAt = new Date().toISOString().split('T')[0];
    const { body, contentType } = buildMultipartBody({ patientId, takenAt }, { buffer: Buffer.alloc(0), filename: 'empty.jpg', mime: 'image/jpeg' });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/progress-photos/upload',
      headers: {
        ...authHeaders(ownerToken, tenantId),
        'content-type': contentType,
      },
      payload: body,
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /v1/progress-photos/:id/file for non-upload photo (external URL) → 404', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/progress-photos',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId, imageUrl: 'https://example.com/photo.jpg', takenAt: new Date().toISOString().split('T')[0] },
    });
    expect(createRes.statusCode).toBe(201);
    const extPhotoId = createRes.json().id;
    const res = await app.inject({
      method: 'GET',
      url: `/v1/progress-photos/${extPhotoId}/file`,
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(res.statusCode).toBe(404);
  });
});
