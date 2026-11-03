/**
 * Top navigation bar – shared by every page.
 */
class NavBar {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.root = page.getByTestId('navbar');
    this.logo = page.getByTestId('navbar-logo');
    this.productsLink = page.getByTestId('navbar-products-link');
    this.cartLink = page.getByTestId('navbar-cart-link');
    this.cartBadge = page.getByTestId('navbar-cart-badge');
    this.signInLink = page.getByTestId('navbar-signin-link');
    this.signUpLink = page.getByTestId('navbar-signup-link');
    this.userMenu = page.getByTestId('navbar-user-menu');
    this.username = page.getByTestId('navbar-username');
    this.usernameLink = page.getByTestId('navbar-username-link');
    this.logoutButton = page.getByTestId('navbar-logout-button');
    this.mobileMenuButton = page.getByTestId('navbar-mobile-menu-button');

    // Mobile (hamburger) menu – desktop links are hidden below the md breakpoint
    this.mobileMenu = page.getByTestId('navbar-mobile-menu');
    this.mobileProductsLink = page.getByTestId('navbar-mobile-products-link');
    this.mobileCartLink = page.getByTestId('navbar-mobile-cart-link');
    this.mobileSignInLink = page.getByTestId('navbar-mobile-signin-link');
    this.mobileSignUpLink = page.getByTestId('navbar-mobile-signup-link');
  }

  async openMobileMenu() {
    if (!(await this.mobileMenu.isVisible())) await this.mobileMenuButton.click();
    await this.mobileMenu.waitFor();
  }

  async goToProducts() {
    await this.productsLink.click();
  }

  async goToCart() {
    await this.cartLink.click();
  }

  async goToSignIn() {
    await this.signInLink.click();
  }

  async goToSignUp() {
    await this.signUpLink.click();
  }

  async goToOrders() {
    await this.usernameLink.click();
  }

  async logout() {
    await this.logoutButton.click();
  }

  /** @returns {Promise<number>} number shown on the cart badge (0 when hidden) */
  async cartCount() {
    if (!(await this.cartBadge.isVisible())) return 0;
    return Number((await this.cartBadge.innerText()).trim());
  }
}

module.exports = { NavBar };
