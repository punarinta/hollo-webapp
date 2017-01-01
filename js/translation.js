//  MUST BE IN ES5

var $locales = [];

$locales['en-US'] =
{
  BTN_PROFILE       : 'Profile',
  BTN_INBOX         : 'Inbox',
  BTN_MUTED         : 'Muted',

  HINT_CHAT_SEARCH  : 'Search chat or start new',

  self: 'English (US)'
};

$locales['ru-RU'] =
{
  BTN_PROFILE : 'Настройки',
  BTN_INBOX   : 'Нужное',
  BTN_MUTED   : 'Ненужное',

  HINT_CHAT_SEARCH  : 'Найти чат или создать новый',

  self: 'English (US)'
};

function _ (code)
{
  return $locales[CFG.locale][code] != undefined ? $locales[CFG.locale][code] : (typeof $locales['en-US'][code] != 'undefined' ? $locales['en-US'][code] : '')
}
