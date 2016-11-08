class ProfilePage extends Component
{
  render()
  {
    return (

      h('profile-page', null,

        h(BottomBar, null,
          h(BarIcon, {caption: 'Profile', img: 'white/profile_new.svg'}),
          h(BarIcon, {caption: 'Hollo`d', img: 'white/email_new.svg', onclick: () => ML.go('chats')}),
          h(BarIcon, {caption: 'Muted', img: 'white/muted_new.svg', onclick: () => ML.go('chats', {muted: 1})})
        )
      )
    );
  }
}