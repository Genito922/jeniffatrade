// GET /api/video/:key — sert une vidéo depuis R2 avec support des range requests
export async function onRequestGet(context) {
  const { params, request, env } = context;

  if (!env.VIDEOS) {
    return new Response('R2 non configuré.', { status: 500 });
  }

  const rangeHeader = request.headers.get('Range');

  // Sans range : streaming complet
  if (!rangeHeader) {
    const obj = await env.VIDEOS.get(params.key);
    if (!obj) return new Response('Vidéo introuvable.', { status: 404 });

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=31536000');
    if (obj.size) headers.set('Content-Length', String(obj.size));

    return new Response(obj.body, { headers });
  }

  // Range request (seek navigateur) : on lit la taille via head()
  const head = await env.VIDEOS.head(params.key);
  if (!head) return new Response('Vidéo introuvable.', { status: 404 });

  const size = head.size;
  const m = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
  const start = m && m[1] !== '' ? parseInt(m[1]) : (m && m[2] ? size - parseInt(m[2]) : 0);
  const end   = m && m[2] !== '' ? Math.min(parseInt(m[2]), size - 1) : size - 1;
  const length = end - start + 1;

  const obj = await env.VIDEOS.get(params.key, { range: { offset: start, length } });
  if (!obj) return new Response('Erreur R2.', { status: 500 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(length));
  headers.set('Cache-Control', 'public, max-age=31536000');

  return new Response(obj.body, { status: 206, headers });
}
