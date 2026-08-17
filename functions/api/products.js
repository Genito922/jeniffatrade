// GET /api/products  -> liste tous les articles du catalogue
export async function onRequestGet(context) {
  const { env } = context;
  const list = await env.CATALOGUE.list({ prefix: 'product:' });

  const products = [];
  for (const key of list.keys) {
    const value = await env.CATALOGUE.get(key.name);
    if (value) {
      try { products.push(JSON.parse(value)); } catch (e) { /* entrée corrompue, ignorée */ }
    }
  }
  products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return Response.json(products);
}

// POST /api/products  -> crée ou met à jour un article (protégé par le code d'accès)
export async function onRequestPost(context) {
  const { request, env } = context;

  const pin = request.headers.get('X-Admin-Pin');
  if (!env.ADMIN_PIN || pin !== env.ADMIN_PIN) {
    return new Response(JSON.stringify({ error: 'Code incorrect.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const product = await request.json();
  if (!product || !product.id || !product.name) {
    return new Response(JSON.stringify({ error: 'Article invalide.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await env.CATALOGUE.put('product:' + product.id, JSON.stringify(product));
  return Response.json({ ok: true, id: product.id });
}
