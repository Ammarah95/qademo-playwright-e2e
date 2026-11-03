const { test, expect } = require('../../src/fixtures/test-fixtures');

test.describe('Products API', { tag: '@api' }, () => {
  test('GET /api/products returns a list of valid products', { tag: '@smoke' }, async ({ request }) => {
    const res = await request.get('/api/products');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    for (const p of body.data) {
      expect.soft(p).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          slug: expect.stringMatching(/^[a-z0-9-]+$/),
          price: expect.any(Number),
          stock: expect.any(Number),
          isActive: expect.any(Boolean),
        }),
      );
      expect.soft(p.price, `price of ${p.slug}`).toBeGreaterThan(0);
      expect.soft(p.stock, `stock of ${p.slug}`).toBeGreaterThanOrEqual(0);
    }
  });

  test('product slugs and ids are unique', async ({ productApi }) => {
    const products = await productApi.list();
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });

  test('GET /api/products/:slug returns the matching product', async ({ productApi }) => {
    const [first] = await productApi.list();
    const { status, body } = await productApi.getBySlug(first.slug);
    expect(status).toBe(200);
    expect(body.data).toMatchObject({ id: first.id, slug: first.slug, name: first.name, price: first.price });
  });

  test('GET /api/products/:slug for unknown slug is not successful', async ({ productApi }) => {
    const { status, body } = await productApi.getBySlug(`no-such-product-${Date.now()}`);
    expect(status).toBeGreaterThanOrEqual(400);
    expect(body?.success).not.toBe(true);
  });

  test('GET /api/auth/me without a session returns 401', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
