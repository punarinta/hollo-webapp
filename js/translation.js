//  MUST BE IN ES5

var $locales = [];

$locales['en-US'] =
{
  BTN_PROFILE       : 'Profile',
  BTN_INBOX         : 'Inbox',
  BTN_MUTED         : 'Muted',
  BTN_OK            : 'OK',
  BTN_CANCEL        : 'Cancel',
  BTN_LOGOUT        : 'Logout',
  BTN_TESTPUSH      : 'Test notifications',

  CHAT_MUTE         : 'Mute',
  CHAT_UNMUTE       : 'Unmute',
  CHAT_READ         : 'Mark as\nread',
  CHAT_UNREAD       : 'Mark as\nunread',
  CHAT_RENAME       : 'Rename chat',
  CHAT_LEAVE        : 'Leave chat',
  CHAT_CLEAR        : 'Clear notes',

  CAP_MY_NOTES      : 'My notes',

  SYS_SETTINGS      : 'Settings',
  SYS_EMOJIS        : 'Emojis replace words',
  SYS_AVATARS       : 'Colored avatars',
  SYS_NOTES         : 'Show local notes',
  SYS_PUSHINFO      : 'Notification will be delivered in ~5 seconds. OK to test mobile push, Cancel to test desktop push.',

  HINT_CHAT_SEARCH  : 'Search chat or start new',

  self: 'English (US)'
};

$locales['ru-RU'] =
{
  BTN_PROFILE       : 'Настройки',
  BTN_INBOX         : 'Нужное',
  BTN_MUTED         : 'Ненужное',
  BTN_OK            : 'OK',
  BTN_CANCEL        : 'Отменить',
  BTN_LOGOUT        : 'Выйти',
  BTN_TESTPUSH      : 'Тест уведомлений',

  CHAT_MUTE         : 'В ненужное',
  CHAT_UNMUTE       : 'В нужное',
  CHAT_READ         : 'Отметить как\nпрочит.',
  CHAT_UNREAD       : 'Отметить как\nнепрочит.',
  CHAT_RENAME       : 'Переименовать чат',
  CHAT_LEAVE        : 'Покинуть чат',
  CHAT_CLEAR        : 'Очистить заметки',

  CAP_MY_NOTES      : 'Мои заметки',

  SYS_SETTINGS      : 'Настройки',
  SYS_EMOJIS        : 'Эмоджи заменяют слова',
  SYS_AVATARS       : 'Цветные аватары',
  SYS_NOTES         : 'Включить заметки',
  SYS_PUSHINFO      : 'Ужедомление будет доставлено через ~5 секунд. «OK» — мобильник, «Отменить» — десктоп.',

  HINT_CHAT_SEARCH  : 'Найти чат или создать новый',

  self: 'Русский'
};

function _ (code)
{
  return $locales[CFG.locale][code] != undefined ? $locales[CFG.locale][code] : (typeof $locales['en-US'][code] != 'undefined' ? $locales['en-US'][code] : code)
}
