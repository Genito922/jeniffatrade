// DELETE /api/products/:id  -> supprime un article (protégé par le code d'accès)
export async function onRequestDelete(context) {
  const { params, request, env } = context;

  const pin = request.headers.get('X-Admin-Pin');
  if (!env.ADMIN_PIN || pin !== env.ADMIN_PIN) {
    return new Response(JSON.stringify({ error: 'Code incorrect.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await env.CATALOGUE.delete('product:' + params.id);
  return Response.json({ ok: true });
}
