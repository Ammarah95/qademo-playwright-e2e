/** Expected UI copy – kept in one place so a wording change is a one-line fix. */
module.exports = {
  login: {
    invalidCredentials: 'Invalid username or password',
  },
  signup: {
    emailRequired: 'Email address is required',
    phoneRequired: 'Phone number is required',
    passwordRequired: 'Password is required',
    confirmRequired: 'Please confirm your password',
    invalidEmail: 'Please enter a valid email address',
    phoneTooShort: 'Phone number must be at least 7 digits',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordsMismatch: 'Passwords do not match',
    duplicateEmail: 'An account with this email address already exists',
  },
  checkout: {
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    addressRequired: 'Address is required',
    cardRequired: 'Card number is required',
    expiryRequired: 'Expiry is required',
    cvvRequired: 'CVV is required',
    nameRequired: 'Name is required',
    invalidCard: 'Enter a valid 16-digit card number',
    invalidCvv: '3-4 digits',
  },
  cart: {
    empty: 'Your cart is empty',
  },
  order: {
    confirmed: 'Order Confirmed!',
  },
  product: {
    notFound: 'Product Not Found',
  },
};
