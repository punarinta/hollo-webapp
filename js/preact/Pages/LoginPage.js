class LoginPage extends Component
{
  componentDidMount()
  {

  }

  loginWithGoogle()
  {
    console.log('111')
  }

  loginWithImap()
  {

  }

  render()
  {
    return (

      h(
        'login-page', {id: 'page-login', className: 'page fullhide'},
        h('div', null,
          h('img', {className: 'logo', src:'/gfx/white/logo.svg'}),
          h('div', {className: 'text'}, 'sign in'),
          h('button', {className: 'google', onclick: this.loginWithGoogle}, 'Sign in with Google'),
          h('div', {className: 'text'}, 'or'),
          h('div', {className: 'input'},
            h('input', {className: 'input', type: 'email', placeholder: 'Email', autofocus: 'autofocus' })
          ),
          h('div', {className: 'input'},
            h('input', {className: 'input', type: 'password', placeholder: 'Password'})
          ),
          h('button', {className: 'login', disabled: 'disabled', onclick: this.loginWithImap}, 'sign in')
        )
      )
    );
  }
}