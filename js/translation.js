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
  BTN_ADD_USERS     : 'Add more',
  BTN_ADD_SUBJ      : 'New Subject',

  CHAT_MUTE         : 'Mute',
  CHAT_UNMUTE       : 'Unmute',
  CHAT_READ         : 'Mark as\nread',
  CHAT_UNREAD       : 'Mark as\nunread',
  CHAT_RENAME       : 'Rename chat',
  CHAT_LEAVE        : 'Leave chat',
  CHAT_CLEAR        : 'Clear notes',

  CAP_MY_NOTES      : 'My notes',
  CAP_NEW_CHAT      : 'Create a chat with %s',
  CAP_WRITE_NEW     : 'Write a new hollo...',
  CAP_SUBJ_FLT      : 'Filtering by subject',
  CAP_NEW_SUBJ      : 'New subject',
  CAP_NEW_NAME      : 'Enter new name:',

  HINT_FLT_ON       : 'To start a new\nconversation type in\nan email address.',
  HINT_SYNCING      : 'Welcome to Hollo!\nWait a bit please until\nyour messages are fetched...',
  HINT_NEW_CHAT     : 'Wanna create a new chat?\nJust type in an email!',
  HINT_NO_MSGS      : 'No messages yet\nOr they became too old',
  HINT_NO_NOTES     : 'Feel free to talk to yourself here,\nmaybe you need to do something?\nOr write down a shopping list?',
  HINT_NO_FILES     : 'No files in this chat',
  HINT_NO_SUBJS     : 'No subjects in this chat',
  HINT_BIG_FILE     : 'Sorry, maximum attachment size is 10MB.',
  HINT_AREYOUSURE   : 'Are you sure?',

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
  BTN_ADD_USERS     : 'Добавить собеседника',
  BTN_ADD_SUBJ      : 'Новая тема',

  CHAT_MUTE         : 'В ненужное',
  CHAT_UNMUTE       : 'В нужное',
  CHAT_READ         : 'Отметить как\nпрочит.',
  CHAT_UNREAD       : 'Отметить как\nнепрочит.',
  CHAT_RENAME       : 'Переименовать чат',
  CHAT_LEAVE        : 'Покинуть чат',
  CHAT_CLEAR        : 'Очистить заметки',

  CAP_MY_NOTES      : 'Мои заметки',
  CAP_NEW_CHAT      : 'Создать чат с %s',
  CAP_WRITE_NEW     : 'Напишите что-нибудь...',
  CAP_SUBJ_FLT      : 'Фильтр по теме',
  CAP_NEW_SUBJ      : 'Новая тема',
  CAP_NEW_NAME      : 'Укажите новое имя:',

  HINT_FLT_ON       : 'Чтобы создать новый чат\nвпишите email-адрес',
  HINT_SYNCING      : 'Добро пожаловать в Hollo!\nПодождите немного пока\nидёт синхронизация...',
  HINT_NEW_CHAT     : 'Хотите создать новый чат?\nПросто впишите email-адрес!',
  HINT_NO_MSGS      : 'В этом чате ещё нет сообщений\nИли они устарели',
  HINT_NO_NOTES     : 'Оставляйте тут заметки для себя\nНапример, список покупок',
  HINT_NO_FILES     : 'В этом чате ещё нет файлов',
  HINT_NO_SUBJS     : 'В этом чате ещё нет тем',
  HINT_BIG_FILE     : 'К сожалению, невозможно прикрепить файл размером более 10МБ.',
  HINT_AREYOUSURE   : 'Вы уверены?',

  SYS_SETTINGS      : 'Настройки',
  SYS_EMOJIS        : 'Эмоджи заменяют слова',
  SYS_AVATARS       : 'Цветные аватары',
  SYS_NOTES         : 'Включить заметки',
  SYS_PUSHINFO      : 'Уведомление будет доставлено через ~5 секунд. «OK» — мобильник, «Отменить» — десктоп.',

  HINT_CHAT_SEARCH  : 'Найти чат или создать новый',

  self: 'Русский'
};

function _ (code, vars)
{
  var text = $locales[CFG.locale][code] != undefined ? $locales[CFG.locale][code] : (typeof $locales['en-US'][code] != 'undefined' ? $locales['en-US'][code] : code);

  if (vars)
  {
    var i, items = text.split('%s');
    text = items[0];
    for (i = 0; i < vars.length; i++)
    {
      text += vars[i] + items[i + 1]
    }
  }

  if (text.indexOf("\n") == -1)
  {
    return text
  }
  else
  {
    var i, hText = [];
    text = text.split("\n");
    for (i in text)
    {
      hText.push(text[i]);
      hText.push(h('br'));
    }

    return hText
  }
}
