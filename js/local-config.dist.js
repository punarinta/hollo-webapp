/*
 * Create 'local-config.js' file out of this one and save your configuration there
 */

// Root of the API, with protocol and trailing slash
CFG.apiRoot = 'https://app.hollo.email/api/';

// Redirect for Google login, e.g. 'https://app.hollo.email/oauth/google'
CFG.redirectUrl = null;

// Instant messaging notifier
CFG.notifierUrl = 'ws://localhost:1488/';

// set to 'true' to be able to use faked user agent modes
CFG.local = false;