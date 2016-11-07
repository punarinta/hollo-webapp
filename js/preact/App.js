class App extends Component
{
  constructor()
  {
    super();
    this.state.page = 'loading';
    this.state.pageMode = 0;
    this.state.pagePayload = null;
    this.state.currentDemo = null;
    this.state.widthMode = window.innerWidth > 768;

    if (typeof mixpanel != 'undefined' && !mixpanel.off)
    {
      mixpanel.identify(data.user.email);
      mixpanel.people.set(
      {
        '$email':   data.user.email,
        '$name':    data.user.name,
        'hollo_id': data.user.id
      });
    }
    else
    {
      window.mixpanel = {track: () => {}, off: 1}
    }
  }

  componentDidMount()
  {
    if (localStorage.getItem('sessionId'))
    {
      ML.sessionId = localStorage.getItem('sessionId');
    }


    // === ROUTER ===
    window.onpopstate = (e) =>
    {
      let r = e.state.route, rs = r.split('/');

      if (rs[0] == 'chat')
      {
        this.setState({page: 'chat', pagePayload: rs[1]});
      }
      else
      {
        switch (r)
        {
          case 'contacts':
            // if (AU.user) CO.show(e.state.data || 7);
            this.setState({page: 'contacts', pageMode: e.state.data || 7});
            break;

          case 'auth/login':
            this.setState({page: 'login'});
            break;

          case 'auth/logout':
            ML.api('auth', 'logout', null, () =>
            {
              this.setState({page: 'login'});
            });
            break;

          case 'profile':
            this.setState({page: 'profile'});
            break;

          case 'demo':
            ML.go('contacts');
        }
      }
    };

    let oauthCode = ML.getQueryVar('code');
    if (oauthCode)
    {
      let isMobile = window.location.pathname == '/oauth/googleMobile';

      ML.api('auth', 'processOAuthCode', {code: oauthCode, redirectUrl: CFG.redirectUrl + (isMobile?'Mobile':'')}, data =>
      {
        if (data.user)
        {
          // AU.init(data);

          if (isMobile)
          {
            history.go(1 - history.length);
          }
          else
          {
            ML.go('contacts')
          }
        }
        else
        {
          localStorage.removeItem('sessionId');
          ML.go('auth/login');
        }
      },
      () =>
      {
        ML.mbox('Google login API is down. Say what?', 0, () =>
        {
          this.setState({page: 'login'});
        })
      });
    }
    else ML.api('auth', 'status', {}, data =>
    {
      if (data.user)
      {
        // AU.init(data);

        let p = document.location.pathname;
        if (p == '/') ML.go('contacts');
        else ML.go(p.substring(1))
      }
      else
      {
        localStorage.removeItem('sessionId');
        ML.go('auth/login')
      }
    });
  }

  render()
  {
    // place here the logic of page switching
    let pages = [];

    switch (this.state.page)
    {
      case 'loading':
        pages = h(LoadingPage);
        break;

      case 'login':
        pages = h(LoginPage);
        break;

      case 'profile':
        pages = h(ProfilePage);
        break;

      case 'contacts':
        pages = [h(ChatsPage, {mode: this.state.pageMode})];
        if (this.state.widthMode)
        {
          pages.push(h(MessagesPage, {chatId: this.state.pagePayload}))
        }
        break;

      case 'chat':
        pages = [h(MessagesPage, {chatId: this.state.pagePayload, mode: this.state.pageMode})];
        if (this.state.widthMode)
        {
          pages.unshift(h(ChatsPage))
        }
        break;
    }

    return h('div', { id: 'app' }, pages);
  }
}

document.body.innerHTML = '';
render(h(App), document.body);