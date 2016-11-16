class ProfilePage extends Component
{
  optEmojiChanged(value)
  {
    value *= 1;

    ML.api('settings', 'update', {flag: {name: 'emojisReplace', value}}, () =>
    {
      CFG.emojisReplace = value;
    });
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
    ML.emit('messagebox', {html: 'After you close this message you will have 5 seconds to switch off your display', cb: () =>
    {
      ML.api('settings', 'testNotification');
    }})
  }

  render()
  {
    let user = this.props.user;

    return (

      h('profile-page', {style: {zIndex: this.props.zIndex}},
        h('div', {className: 'head'},
          h(Avatar, {user: user}),
          h('div', null,
            h('div', {className: 'name'},
              user.name
            ),
            h('div', {className: 'email'},
              user.email
            )
          )
        ),
        h('button', {onclick: () => ML.go('auth/logout')}, 'Logout'),
        h('br'),
        h('button', {onclick: this.testNotifications.bind(this)}, 'Test notifications'),
        h('div', {className: 'group'}, 'Application version'),
        h('div', {className: 'line'}, APPVER),
        h('div', {className: 'group'}, 'Settings'),
        h('ul', null,
          h(Checkbox, {caption: 'Emojis replace words', checked: CFG.emojisReplace, onchange: this.optEmojiChanged.bind(this)}),
          h(Checkbox, {caption: 'Colored avatars', checked: CFG.colorAvatars, onchange: this.optAvatarsChanged.bind(this)})
        ),
        h(BottomBar, null,
          h(BarIcon, {caption: 'Profile', img: 'white/profile'}),
          h(BarIcon, {className: 'opa-85', caption: 'Inbox', img: 'white/email', onclick: () => ML.go('chats')}),
          h(BarIcon, {className: 'opa-85', caption: 'Muted', img: 'white/muted', onclick: () => ML.go('chats', {muted: 1})})
        )
      )
    );
  }
}