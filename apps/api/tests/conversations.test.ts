import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app';
import http from 'http';

test('Conversations & History Test Suite', async (t) => {
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

  const authHeaders = {
    Authorization: 'Bearer mock-test-token',
    'Content-Type': 'application/json',
  };

  await t.test('POST /conversations saves conversation successfully', async () => {
    const res = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        id: 'conv-test-01',
        title: 'Konsultasi Lembur Karyawan',
        topic: 'Lembur',
        messages: [
          { id: 'm1', role: 'user', content: 'Berapa upah lembur per jam?', createdAt: new Date().toISOString() },
          { id: 'm2', role: 'assistant', content: 'Upah lembur dihitung berdasarkan PP 35/2021.', createdAt: new Date().toISOString() },
        ],
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json() as { id: string; title: string; messageCount: number };
    assert.equal(body.id, 'conv-test-01');
    assert.equal(body.title, 'Konsultasi Lembur Karyawan');
    assert.equal(body.messageCount, 2);
  });

  await t.test('GET /conversations lists saved conversations', async () => {
    const res = await fetch(`${baseUrl}/conversations`, {
      headers: authHeaders,
    });

    assert.equal(res.status, 200);
    const body = await res.json() as { conversations: Array<{ id: string; title: string }>; total: number };
    assert.ok(body.total >= 1);
    const found = body.conversations.find((c) => c.id === 'conv-test-01');
    assert.ok(found);
    assert.equal(found.title, 'Konsultasi Lembur Karyawan');
  });

  await t.test('GET /conversations/:id returns detail with messages', async () => {
    const res = await fetch(`${baseUrl}/conversations/conv-test-01`, {
      headers: authHeaders,
    });

    assert.equal(res.status, 200);
    const body = await res.json() as { id: string; messages: unknown[] };
    assert.equal(body.id, 'conv-test-01');
    assert.equal(body.messages.length, 2);
  });

  await t.test('GET /conversations/:id returns 404 for non-existent id', async () => {
    const res = await fetch(`${baseUrl}/conversations/non-existent-conv`, {
      headers: authHeaders,
    });

    assert.equal(res.status, 404);
  });

  await t.test('DELETE /conversations/:id deletes conversation', async () => {
    const res = await fetch(`${baseUrl}/conversations/conv-test-01`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    assert.equal(res.status, 200);
    const body = await res.json() as { status: string };
    assert.equal(body.status, 'deleted');

    // Confirm it's gone
    const checkRes = await fetch(`${baseUrl}/conversations/conv-test-01`, {
      headers: authHeaders,
    });
    assert.equal(checkRes.status, 404);
  });
});

