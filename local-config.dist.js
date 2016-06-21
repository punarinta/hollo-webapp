/*
 * Create 'local-config.js' file out of this one and save your configuration there
 */

// Root of the API, e.g. 'api.hollo.email'
CFG.apiRoot = document.location.hostname.replace('app.', 'api.');

// Redirect for Google login, e.g. 'https://app.hollo.email/oauth/google'
CFG.redirectUrl = null;
