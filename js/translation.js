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
  BTN_SIGN_IN       : 'sign in',
  BTN_GOOGLE        : 'Sign in with Google',

  CHAT_MUTE         : 'Mute',
  CHAT_UNMUTE       : 'Unmute',
  CHAT_READ         : 'Mark as\nread',
  CHAT_UNREAD       : 'Mark as\nunread',
  CHAT_RENAME       : 'Rename chat',
  CHAT_LEAVE        : 'Leave chat',
  CHAT_CLEAR        : 'Clear notes',

  MSG_FORWARD       : 'Forward message...',
  MSG_SHOW_ORIG     : 'Show original email',
  MSG_SHOW_HTML     : 'Show HTML version',

  CAP_MY_NOTES      : 'My notes',
  CAP_NEW_CHAT      : 'Create a chat with %s',
  CAP_WRITE_NEW     : 'Write a new hollo...',
  CAP_SUBJ_FLT      : 'Filtering by subject',
  CAP_NEW_SUBJ      : 'New subject',
  CAP_NEW_NAME      : 'Enter new name:',
  CAP_SIGN_IN       : 'Sign in',
  CAP_EMAIL         : 'Email',
  CAP_PASSWORD      : 'Password',

  HINT_FLT_ON       : 'To start a new\nconversation type in\nan email address.',
  HINT_SYNCING      : 'Welcome to Hollo!\nWait a bit please until\nyour messages are fetched...',
  HINT_NEW_CHAT     : 'Wanna create a new chat?\nJust type in an email!',
  HINT_NO_MSGS      : 'No messages yet\nOr they became too old',
  HINT_NO_NOTES     : 'Feel free to talk to yourself here,\nmaybe you need to do something?\nOr write down a shopping list?',
  HINT_NO_FILES     : 'No files in this chat',
  HINT_NO_SUBJS     : 'No subjects in this chat',
  HINT_AREYOUSURE   : 'Are you sure?',
  HINT_CHAT_SEARCH  : 'Search chat or start new',
  HINT_FORWARDED    : 'Forwarded message',

  ERR_BIG_FILE      : 'Sorry, maximum attachment size is 10MB.',
  ERR_NO_ORIG       : 'We are sorry, but this message is absent in your mailbox.',

  SYS_SETTINGS      : 'Settings',
  SYS_EMOJIS        : 'Emojis replace words',
  SYS_AVATARS       : 'Colored avatars',
  SYS_NOTES         : 'Show local notes',
  SYS_PUSHINFO      : 'Notification will be delivered in ~5 seconds. OK to test mobile push, Cancel to test desktop push.',

  CAL_OPENLINK      : 'Open in calendar',
  CAL_YOU_ACCEPT    : '✔ ️you accepted this invite',
  CAL_ACCEPT        : '✔ %s accepted this invite',
  CAL_YOU_TENT      : '✔ ️you accepted this invite',
  CAL_TENT          : '❓ %s said "maybe" to this invite',

  self: 'English (US)'
};

$locales['sv-SE'] =
{
  BTN_PROFILE       : 'Profil',
  BTN_INBOX         : 'Inbox',
  BTN_MUTED         : 'Ljudlös',
  BTN_OK            : 'OK',
  BTN_CANCEL        : 'Avbryt',
  BTN_LOGOUT        : 'Logga ut',
  BTN_TESTPUSH      : 'Test notifikation',
  BTN_ADD_USERS     : 'Lägg till',
  BTN_ADD_SUBJ      : 'Nytt Ämne',
  BTN_SIGN_IN       : 'logga in',
  BTN_GOOGLE        : 'Logga in med Google',

  CHAT_MUTE         : 'Ljudlös',
  CHAT_UNMUTE       : 'Ljud',
  CHAT_READ         : 'Markera\nsom läst',
  CHAT_UNREAD       : 'Markera\nsom oläst',
  CHAT_RENAME       : 'Byt chatts namn',
  CHAT_LEAVE        : 'Lämna chatt',
  CHAT_CLEAR        : 'Rensa anteckningar',

  MSG_FORWARD       : 'Vidarebefodra...',
  MSG_SHOW_ORIG     : 'Visa originala meddelandet',
  MSG_SHOW_HTML     : 'Visa HTML-versionen',

  CAP_MY_NOTES      : 'Mina anteckningar',
  CAP_NEW_CHAT      : 'Skapa en chatt med %s',
  CAP_WRITE_NEW     : 'Skriv ett nytt hollo...',
  CAP_SUBJ_FLT      : 'Filtrerar nu',
  CAP_NEW_SUBJ      : 'Nytt ämne',
  CAP_NEW_NAME      : 'Nytt namn:',
  CAP_SIGN_IN       : 'Logga in',
  CAP_EMAIL         : 'E-post',
  CAP_PASSWORD      : 'Lösenord',

  HINT_FLT_ON       : 'För att påbörja en ny chatt\nskriv in en email adress.',
  HINT_SYNCING      : 'Välkommen till Hollo!\nVar god och vänta tills\ndina meddelande hämtas...',
  HINT_NEW_CHAT     : 'Vill du skapa en ny chatt?\nSkriv mottagarens emailadress',
  HINT_NO_MSGS      : 'Det finns Inga meddelande in denna chatt ännu\nEller så har de blivit för gamla',
  HINT_NO_NOTES     : 'Här kan du lägga till egna anteckningar,\nkanske skapa en inköpslista eller påminna\ndig själva om att svara på ett mail',
  HINT_NO_FILES     : 'Inga bifogade filer i denna chatt',
  HINT_NO_SUBJS     : 'Inga ämnen i denna chatt',
  HINT_AREYOUSURE   : 'Är du säker?',
  HINT_CHAT_SEARCH  : 'Sök chatt eller starta en ny',
  HINT_FORWARDED    : 'Vidarebefordrat meddelande',

  ERR_BIG_FILE      : 'Maximal filstorlek är 10 MB.',
  ERR_NO_ORIG       : 'Meddelandet finns inte i din brevlåda.',

  SYS_SETTINGS      : 'Inställningar',
  SYS_EMOJIS        : 'Emoji ersätter ord',
  SYS_AVATARS       : 'Färgglada avatarer',
  SYS_NOTES         : 'Visa mina anteckningar',
  SYS_PUSHINFO      : 'Notifikation levereras om -5 sekunder.\nOK för att skicka till mobil, Cancel för att skicka till desktop.',

  CAL_OPENLINK      : 'Öppna i kalendern',
  CAL_YOU_ACCEPT    : '✔ du har accepterat inbjudan',
  CAL_ACCEPT        : '✔ %s har accepterat inbjudan',
  CAL_YOU_TENT      : '❓ ️du svarade "kanske" på denna inbjudan',
  CAL_TENT          : '❓ ️%s svarade "kanske" på denna inbjudan',

  self: 'svenska'
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
  BTN_SIGN_IN       : 'войти',
  BTN_GOOGLE        : 'войти с Google-аккаунтом',

  CHAT_MUTE         : 'В ненужное',
  CHAT_UNMUTE       : 'В нужное',
  CHAT_READ         : 'Отметить как\nпрочит.',
  CHAT_UNREAD       : 'Отметить как\nнепрочит.',
  CHAT_RENAME       : 'Переименовать чат',
  CHAT_LEAVE        : 'Покинуть чат',
  CHAT_CLEAR        : 'Очистить заметки',

  MSG_FORWARD       : 'Переслать сообщение...',
  MSG_SHOW_ORIG     : 'Показать оригинал',
  MSG_SHOW_HTML     : 'Показать HTML-версию',

  CAP_MY_NOTES      : 'Мои заметки',
  CAP_NEW_CHAT      : 'Создать чат с %s',
  CAP_WRITE_NEW     : 'Напишите что-нибудь...',
  CAP_SUBJ_FLT      : 'Фильтр по теме',
  CAP_NEW_SUBJ      : 'Новая тема',
  CAP_NEW_NAME      : 'Укажите новое имя:',
  CAP_SIGN_IN       : 'Вход',
  CAP_EMAIL         : 'емэйл-адрес',
  CAP_PASSWORD      : 'пароль',

  HINT_FLT_ON       : 'Чтобы создать новый чат\nвпишите email-адрес',
  HINT_SYNCING      : 'Добро пожаловать в Hollo!\nПодождите немного пока\nидёт синхронизация...',
  HINT_NEW_CHAT     : 'Хотите создать новый чат?\nПросто впишите email-адрес!',
  HINT_NO_MSGS      : 'В этом чате ещё нет сообщений\nили они устарели',
  HINT_NO_NOTES     : 'Оставляйте тут заметки для себя\nНапример, список покупок',
  HINT_NO_FILES     : 'В этом чате ещё нет файлов',
  HINT_NO_SUBJS     : 'В этом чате ещё нет тем',
  HINT_AREYOUSURE   : 'Вы уверены?',
  HINT_CHAT_SEARCH  : 'Найти чат или создать новый',
  HINT_FORWARDED    : 'Пересланое сообщение',

  ERR_BIG_FILE      : 'К сожалению, невозможно прикрепить файл размером более 10 МБ.',
  ERR_NO_ORIG       : 'К сожалению, это сообщение более не существует в Вашем почтовом ящике.',

  SYS_SETTINGS      : 'Настройки',
  SYS_EMOJIS        : 'Эмоджи заменяют слова',
  SYS_AVATARS       : 'Цветные аватары',
  SYS_NOTES         : 'Включить заметки',
  SYS_PUSHINFO      : 'Уведомление будет доставлено через ~5 секунд. «OK» — мобильник, «Отменить» — десктоп.',

  CAL_OPENLINK      : 'Открыть в календаре',
  CAL_YOU_ACCEPT    : '✔ Вы сказали "да"',
  CAL_ACCEPT        : '✔ %s сказал "да"',
  CAL_YOU_TENT      : '✔ Вы сказали "да"',
  CAL_TENT          : '❓ %s сказал "может быть"',

  self: 'Русский язык'
};

function _ (code, vars, options)
{
  var text = ($locales[CFG.locale] && $locales[CFG.locale][code] != undefined) ? $locales[CFG.locale][code] : (typeof $locales['en-US'][code] != 'undefined' ? $locales['en-US'][code] : code);

  if (vars)
  {
    var i, items = text.split('%s');
    text = items[0];
    for (i = 0; i < vars.length; i++)
    {
      text += vars[i] + items[i + 1]
    }
  }

  if (!options) options = {};

  if (text.indexOf("\n") == -1 || options.singleLine)
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
