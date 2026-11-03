/**
 * Thin client for the public product API.
 * The catalog on qademo.com is live data (stock changes, products get added),
 * so tests ask the API which products are purchasable instead of hard-coding them.
 */
class ProductApi {
  /** @param {import('@playwright/test').APIRequestContext} request */
  constructor(request) {
    this.request = request;
  }

  /** @returns {Promise<Array<{id:number,name:string,slug:string,description:string,price:number,stock:number,isActive:boolean}>>} */
  async list() {
    const res = await this.request.get('/api/products');
    if (!res.ok()) throw new Error(`GET /api/products -> ${res.status()}`);
    const body = await res.json();
    return body.data;
  }

  /** @param {string} slug */
  async getBySlug(slug) {
    const res = await this.request.get(`/api/products/${slug}`);
    return { status: res.status(), body: await res.json().catch(() => null) };
  }

  /** Products that can be added to cart (active and with enough stock). */
  async inStock(minStock = 5) {
    return (await this.list()).filter((p) => p.isActive && p.stock >= minStock);
  }

  async outOfStock() {
    return (await this.list()).filter((p) => p.isActive && p.stock === 0);
  }
}

module.exports = { ProductApi };
