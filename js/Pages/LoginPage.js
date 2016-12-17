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
    if ($platform == 0)
    {
      ML.api('auth', 'getOAuthToken', {redirectUrl: CFG.redirectUrl}, (data) =>
      {
        window.location.href = data;
      });
    }
    else
    {
      if ($platform == 1)
      {
        window.plugins.googleplus.login(
        {
          // optional, space-separated list of scopes, If not included or empty, defaults to `profile` and `email`. 
          'scopes': 'https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/plus.me https://www.google.com/m8/feeds',

          // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
          'webClientId': '438214337744-vcc0cf2j1pgdk1tbkj544lvv4alrilae.apps.googleusercontent.com',

          // optional, but requires the webClientId - if set to true the plugin will also return a serverAuthCode, which can be used to grant offline access to a non-Google server
          'offline': true
        },
        function (token)
        {
          ML.emit('busybox', {mode: 1});

          ML.api('auth', 'processGoogleToken', {token}, data =>
          {
            ML.emit('busybox');
            if (data.user)
            {
              ML.emit('inituser', {data});
              ML.go('chats')
            }
            else
            {
              localStorage.removeItem('sessionId');
              ML.go('auth/login');
            }
          },
          () =>
          {
            ML.emit('busybox');
            ML.emit('messagebox', {html: 'Google login API is down. Say what?', cb: () =>
            {
              this.setState({page: 'login'});
            }});
          },
          (err) =>
          {
            ML.emit('busybox');
            ML.emit('messagebox', {html: 'Error: ' + err});
          });
        },
        function (msg)
        {
          ML.emit('messagebox', {html: 'Error: ' + msg});
        });
      }
      else
      {
        // NWJS-based clients
        ML.api('auth', 'getOAuthToken', {redirectUrl: CFG.redirectUrl + 'Mobile'}, (data) =>
        {
          parent.postMessage({cmd: 'openUrl', url: data}, '*');
        });
      }
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
        h('img', {src: 'gfx/color/logo.svg'}),
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