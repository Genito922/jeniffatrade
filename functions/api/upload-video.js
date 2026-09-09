// POST /api/upload-video — upload d'une vidéo vers R2 (protégé par PIN)
export async function onRequestPost(context) {
  const { request, env } = context;

  const pin = request.headers.get('X-Admin-Pin');
  if (!env.ADMIN_PIN || pin !== env.ADMIN_PIN) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  if (!env.VIDEOS) {
    return Response.json({ error: 'R2_NOT_BOUND' }, { status: 500 });
  }

  const contentType = request.headers.get('Content-Type') || 'video/mp4';
  const body = await request.arrayBuffer();

  if (!body || body.byteLength === 0) {
    return Response.json({ error: 'Vidéo vide.' }, { status: 400 });
  }

  const key = 'vid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  await env.VIDEOS.put(key, body, {
    httpMetadata: { contentType }
  });

  return Response.json({ ok: true, key });
}
