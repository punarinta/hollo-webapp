class ProfilePage extends Component
{
  render()
  {
    let user = this.props.user;

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
        h('div', {className: 'group'}, 'Settings'),
        h('ul', null,
          h(Checkbox, {caption: 'Emojis replace words', checked: CFG.hungryEmojis})
        ),
        h(BottomBar, null,
          h(BarIcon, {caption: 'Profile', img: 'white/profile_new.svg'}),
          h(BarIcon, {caption: 'Hollo`d', img: 'white/email_new.svg', onclick: () => ML.go('chats')}),
          h(BarIcon, {caption: 'Muted', img: 'white/muted_new.svg', onclick: () => ML.go('chats', {muted: 1})})
        )
      )
    );
  }
}