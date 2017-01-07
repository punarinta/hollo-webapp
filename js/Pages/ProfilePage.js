class ProfilePage extends Component
{
  optEmojiChanged(value)
  {
    value *= 1;
    ML.api('settings', 'update', {flag: {name: 'emojisReplace', value}}, () => CFG.emojisReplace = value);
  }

  optNotesChanged(value)
  {
    value *= 1;
    ML.api('settings', 'update', {flag: {name: 'showNotes', value}}, () => CFG.showNotes = value);
  }

  optAvatarsChanged(value)
  {
    value *= 1;

    ML.api('settings', 'update', {flag: {name: 'colorAvatars', value}}, () =>
    {
      CFG.colorAvatars = value;
    });
  }

  testNotifications()
  {
    ML.emit('messagebox', {html: _('SYS_PUSHINFO'), type: 1, cb: (code) =>
    {
      ML.api('settings', 'testNotification', {mode: code ? 'firebase' : 'im'});
    }})
  }

  // ======================

  holloCrewMenu()
  {
    let children =
    [
      h('ul', null,
        h('li', { onclick: this.showEmailDiscovery.bind(this) }, 'Email discovery')
      ),
    ];

    ML.emit('custombox', {className: 'context-menu-message', children})
  }

  showEmailDiscovery()
  {
    let children =
    [
      h(SearchBar, {placeholder: 'Input a name', onchange: this.filterChanged.bind(this)}),
      h('ul', {className: 'discovered-emails', style: {overflow: 'scroll'}}),
      h('button', {onclick: () => ML.emit('custombox')}, 'Close')
    ];

    setTimeout(() => ML.emit('custombox', {className: 'context-menu-message', children, onclick: () => {} }), 50)
  }

  filterChanged(filter)
  {
    clearTimeout(this.filterTimer);

    this.filterTimer = setTimeout( () =>
    {
      if (this.emailFilter != filter && filter.length >= 3)
      {
        this.emailFilter = filter;
        ML.api('sys', 'discover', {token: filter}, function (users)
        {
          let i, html = '';
          for (i in users)
          {
            html += '<li style="white-space: nowrap">' + users[i].name + ': ' + users[i].email + '</li>'
          }
          document.querySelector('.discovered-emails').innerHTML = html;
        });
      }
    }, 500);
  }

  // ======================

  render()
  {
    let user = this.props.user, fill = '#fff', devButton = '';

    if (user.roles & 2)
    {
      devButton = h('button', {onclick: this.holloCrewMenu.bind(this)}, 'Hollo crew menu')
    }

    return (

      h('profile-page', {style: {zIndex: this.props.zIndex}},
        h('div', {className: 'head'},
          h(Avatar, {user: user}),
          h('div', null,
            h('div', {className: 'name'},
              user.name || user.email
            ),
            h('div', {className: 'email'},
              user.email
            )
          )
        ),
        h('button', {onclick: () => ML.go('auth/logout')}, _('BTN_LOGOUT')),
        // TODO: keep this for testers only
        h('button', {onclick: this.testNotifications.bind(this)}, _('BTN_TESTPUSH')),
        devButton,
        h('div', {className: 'group'}, _('SYS_SETTINGS')),
        h('ul', null,
          h(Checkbox, {caption: _('SYS_EMOJIS'), checked: CFG.emojisReplace, onchange: this.optEmojiChanged.bind(this)}),
          h(Checkbox, {caption: _('SYS_AVATARS'), checked: CFG.colorAvatars, onchange: this.optAvatarsChanged.bind(this)}),
          h(Checkbox, {caption: _('SYS_NOTES'), checked: CFG.showNotes, onchange: this.optNotesChanged.bind(this)})
        ),
        h('div', {className: 'appver'}, 'ver: ' + APPVER),
        h('bottom-bar', null,
          h(BarIcon, {caption: _('BTN_PROFILE'), svg: 'profile', fill}),
          h(BarIcon, {className: 'opa-85', caption: _('BTN_INBOX'), svg: 'email', fill, onclick: () => ML.go('chats')}),
          h(BarIcon, {className: 'opa-85', caption: _('BTN_MUTED'), svg: 'muted', fill, onclick: () => ML.go('chats', {muted: 1})})
        )
      )
    );
  }
}