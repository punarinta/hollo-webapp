/*
 * Create 'local-config.js' file out of this one and save your configuration there
 */

// Root of the API, e.g. 'app.hollo.email'
CFG.apiRoot = document.location.hostname;

// Redirect for Google login, e.g. 'https://app.hollo.email/oauth/google'
CFG.redirectUrl = null;

// Instant messaging notifier
CFG.notifierUrl = 'ws://localhost:1488/';