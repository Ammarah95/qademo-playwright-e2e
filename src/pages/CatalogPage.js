const { BasePage } = require('./BasePage');

/**
 * /catalog – product listing grid.
 * Product cards are keyed by product id: product-card-<id>, product-add-to-cart-<id> …
 */
class CatalogPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/catalog');
    this.root = page.getByTestId('catalog-page');
    this.heading = page.getByTestId('catalog-heading');
    this.productCount = page.getByTestId('catalog-product-count');
    this.grid = page.getByTestId('product-grid');
    this.productCards = this.grid.getByTestId(/^product-card-\d+$/);
  }

  async open() {
    await super.open();
    await this.grid.waitFor();
    return this;
  }

  /** @param {number} id */
  card(id) {
    const p = this.page;
    return {
      root: p.getByTestId(`product-card-${id}`),
      link: p.getByTestId(`product-link-${id}`),
      name: p.getByTestId(`product-name-${id}`),
      description: p.getByTestId(`product-description-${id}`),
      price: p.getByTestId(`product-price-${id}`),
      addToCart: p.getByTestId(`product-add-to-cart-${id}`),
      outOfStockBadge: p.getByTestId(`product-out-of-stock-badge-${id}`),
      lowStockBadge: p.getByTestId(`product-low-stock-badge-${id}`),
    };
  }

  /** @param {number} id */
  async addToCart(id) {
    await this.withCartSync(() => this.card(id).addToCart.click());
  }

  /** @param {number} id */
  async openProduct(id) {
    await this.card(id).link.click();
  }

  /** @returns {Promise<number>} the number written in "Browse our complete selection of N products" */
  async displayedProductCount() {
    const text = await this.productCount.innerText();
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : NaN;
  }
}

module.exports = { CatalogPage };
