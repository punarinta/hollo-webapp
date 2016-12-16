class LoginPage extends Component
{
  constructor()
  {
    super();
    this.state.imapEnabled = false;
  }

  componentDidMount()
  {
    this.nameInput.value = localStorage.getItem('imapLogin');
  }

  loginWithGoogle()
  {
    if (window.self === window.top)
    {
      ML.api('auth', 'getOAuthToken', {redirectUrl: CFG.redirectUrl}, (data) =>
      {
        window.location.href = data;
      });
    }
    else
    {
      // not only mobile, but all frame-like clients
      ML.api('auth', 'getOAuthToken', {redirectUrl: CFG.redirectUrl + 'Mobile'}, (data) =>
      {
        parent.postMessage({cmd: 'openUrl', url: data}, '*');
      });
    }
  }

  loginWithImap()
  {
    let user = this.nameInput.value.trim(),
        pass = this.passInput.value.trim();

    if (!user.length || !pass.length)
    {
      ML.emit('messagebox', {html: 'Input both email and password'});
      return;
    }

    // disallow OAuth2 login here
    if (['gmail.com'].indexOf(user.split('@')[1].toLowerCase()) != -1)
    {
      ML.emit('messagebox', {html: 'Use "Sign in with Google" button'});
      return;
    }

    ML.api('auth', 'loginImap',
    {
      'identity': user,
      'credential': pass
    },
    data =>
    {
      // memorize login
      localStorage.setItem('imapLogin', user);
      ML.emit('inituser', {data});
      ML.go('chats');
    });
  }

  emailTyped(e)
  {
    if (e.keyCode == 13)
    {
      this.passInput.focus();
    }
  }

  passwordTyped()
  {
    this.setState({imapEnabled: this.nameInput.value.length && this.passInput.value.length})
  }

  render()
  {
    return (

      h('login-page', null,
        h('img', {src:'/gfx/color/logo.svg'}),
        h('div', {className: 'text'}, 'Sign in'),
        h('button', {className: 'google', onClick: this.loginWithGoogle.bind(this)}, 'Sign in with Google'),
        h('div', {className: 'text'}, 'or'),
        h('div', {className: 'input'},
          h(Input, {type: 'email', ref: (i) => this.nameInput = i ? i.base : 0, placeholder: 'Email', autofocus: 'autofocus', onKeyUp: this.emailTyped.bind(this)})
        ),
        h('div', {className: 'input'},
          h(Input, {type: 'password', ref: (i) => this.passInput = i ? i.base : 0, placeholder: 'Password', onKeyUp: this.passwordTyped.bind(this)})
        ),
        h('button', {className: 'login', disabled: `${this.state.imapEnabled ? '' : 'disabled'}`, onClick: this.loginWithImap.bind(this)}, 'sign in')
      )
    );
  }
}