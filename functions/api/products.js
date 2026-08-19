// GET /api/products
export async function onRequestGet(context) {
  try {
    const { env } = context;

    if (!env.CATALOGUE) {
      return Response.json({ error: 'KV_NOT_BOUND', bindings: Object.keys(env) }, { status: 500 });
    }

    const list = await env.CATALOGUE.list({ prefix: 'product:' });
    const products = [];
    for (const key of list.keys) {
      const value = await env.CATALOGUE.get(key.name);
      if (value) {
        try { products.push(JSON.parse(value)); } catch (_) {}
      }
    }
    products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return Response.json(products);

  } catch (e) {
    return Response.json({ error: e.message, type: e.constructor.name }, { status: 500 });
  }
}

// POST /api/products
export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const pin = request.headers.get('X-Admin-Pin');
    if (!env.ADMIN_PIN || pin !== env.ADMIN_PIN) {
      return Response.json({ error: 'Code incorrect.' }, { status: 401 });
    }

    const product = await request.json();
    if (!product || !product.id || !product.name) {
      return Response.json({ error: 'Article invalide.' }, { status: 400 });
    }

    await env.CATALOGUE.put('product:' + product.id, JSON.stringify(product));
    return Response.json({ ok: true, id: product.id });

  } catch (e) {
    return Response.json({ error: e.message, type: e.constructor.name }, { status: 500 });
  }
}
