class ProfilePage extends Component
{
  optEmojiChanged(value)
  {
    value *= 1;

    ML.api('settings', 'update', {flag: {name: 'emojis-replace', value}}, () =>
    {
      CFG.emojisReplace = value;
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
    let user = this.props.user, flags = user ? user.settings.flags : CFG;

    return (

      h('profile-page', null,
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
          h(Checkbox, {caption: 'Emojis replace words', checked: flags['emojis-replace'], onchange: this.optEmojiChanged.bind(this)})
        ),
        h(BottomBar, null,
          h(BarIcon, {caption: 'Profile', img: 'white/profile'}),
          h(BarIcon, {caption: 'Hollo`d', img: 'white/email', onclick: () => ML.go('chats')}),
          h(BarIcon, {caption: 'Muted', img: 'white/muted', onclick: () => ML.go('chats', {muted: 1})})
        )
      )
    );
  }
}