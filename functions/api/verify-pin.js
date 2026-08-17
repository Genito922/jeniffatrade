// POST /api/verify-pin -> vérifie le code saisi côté serveur (jamais exposé dans le code source)
export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch (e) { body = {}; }

  if (env.ADMIN_PIN && body.pin === env.ADMIN_PIN) {
    return Response.json({ ok: true });
  }
  return new Response(JSON.stringify({ ok: false }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
