// DELETE /api/products/:id  -> supprime un article et sa vidéo R2 si elle existe
export async function onRequestDelete(context) {
  const { params, request, env } = context;

  const pin = request.headers.get('X-Admin-Pin');
  if (!env.ADMIN_PIN || pin !== env.ADMIN_PIN) {
    return new Response(JSON.stringify({ error: 'Code incorrect.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Supprime la vidéo R2 associée si elle existe
  try {
    const existing = await env.CATALOGUE.get('product:' + params.id);
    if (existing && env.VIDEOS) {
      const product = JSON.parse(existing);
      if (product.videoR2Key) {
        await env.VIDEOS.delete(product.videoR2Key);
      }
    }
  } catch (_) {}

  await env.CATALOGUE.delete('product:' + params.id);
  return Response.json({ ok: true });
}
