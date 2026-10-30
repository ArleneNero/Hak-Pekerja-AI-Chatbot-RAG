import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app';
import http from 'http';

test('Express API Gateway Smoke Test Suite', async (t) => {
  const app = createApp();
  let server: http.Server;
  let baseUrl: string;

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}/api/v1`;
      }
      resolve();
    });
  });

  t.after(() => {
    server.close();
  });

  await t.test('GET /health returns 200 ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json() as { status: string; timestamp: string };
    assert.equal(body.status, 'ok');
    assert.ok(body.timestamp);
    assert.ok(res.headers.get('x-request-id'));
  });

  await t.test('POST /chat validates empty question with 400', async () => {
    const res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json() as { error: { code: string; message: string; request_id: string } };
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(body.error.request_id);
  });

  await t.test('GET /conversations returns 401 when token is missing', async () => {
    const res = await fetch(`${baseUrl}/conversations`);
    assert.equal(res.status, 401);
    const body = await res.json() as { error: { code: string } };
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  await t.test('GET /conversations returns 200 with Bearer token', async () => {
    const res = await fetch(`${baseUrl}/conversations`, {
      headers: { Authorization: 'Bearer mock-test-token' },
    });
    assert.equal(res.status, 200);
    const body = await res.json() as { conversations: unknown[]; total: number };
    assert.ok(Array.isArray(body.conversations));
    assert.ok(typeof body.total === 'number');
  });

  await t.test('Unknown route returns 404 with standard error envelope', async () => {
    const res = await fetch(`${baseUrl}/non-existent`);
    assert.equal(res.status, 404);
    const body = await res.json() as { error: { code: string } };
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});

