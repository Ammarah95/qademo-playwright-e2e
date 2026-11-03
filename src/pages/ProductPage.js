const { BasePage } = require('./BasePage');

/** /products/:slug – product detail page */
class ProductPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/catalog');
    this.root = page.getByTestId('product-page');
    this.backToCatalog = page.getByTestId('product-back-to-catalog');
    this.image = page.getByTestId('product-detail-image');
    this.name = page.getByTestId('product-detail-name');
    this.price = page.getByTestId('product-detail-price');
    this.description = page.getByTestId('product-detail-description');
    this.features = page.getByTestId('product-features');
    this.addToCartButton = page.getByTestId('product-add-to-cart-button');
    this.inCartButton = page.getByTestId('product-remove-from-cart-button');
    this.viewCartButton = page.getByTestId('product-view-cart-button');
    this.notFound = page.getByTestId('product-not-found');
    this.notFoundHeading = page.getByTestId('product-not-found-heading');
    this.notFoundBackButton = page.getByTestId('product-not-found-back-button');
  }

  /** @param {string} slug */
  async openBySlug(slug) {
    this.path = `/products/${slug}`;
    await this.open();
    await this.root.or(this.notFound).waitFor();
    return this;
  }

  async addToCart() {
    await this.withCartSync(() => this.addToCartButton.click());
  }

  /** Clicking "In Cart (n)" removes the product from the cart. */
  async removeFromCart() {
    await this.withCartSync(() => this.inCartButton.click());
  }

  async viewCart() {
    await this.viewCartButton.click();
  }
}

module.exports = { ProductPage };
