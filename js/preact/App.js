class App extends Component
{
  constructor()
  {
    super();
    this.state.page = 'loading';
    this.state.chatsPageData = {};
    this.state.messagesPageData = {};
    this.state.pagePayload = null;
    this.state.currentDemo = null;
    this.state.widthMode = window.innerWidth > 768;
    this.state.demoBox = null;
    this.state.messageBox = null;
  }

  componentDidMount()
  {
    if (localStorage.getItem('sessionId'))
    {
      ML.sessionId = localStorage.getItem('sessionId');
    }

    window.addEventListener('hollo:demobox', this.showDemoBox.bind(this));
    window.addEventListener('hollo:messagebox', this.showMessageBox.bind(this));

    // === ROUTER ===
    window.onpopstate = (e) =>
    {
      let r = e.state.route, rs = r.split('/');

      if (rs[0] == 'chat')
      {
        this.setState({page: 'chat', messagesPageData: {chatId: rs[1]}});
      }
      else
      {
        switch (r)
        {
          case 'chats':
            this.setState({page: 'chats', chatsPageData: e.state.data});
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
          ML.initUser(data);

          if (isMobile)
          {
            history.go(1 - history.length);
          }
          else
          {
            ML.go('chats')
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
        ML.initUser(data);

        let p = document.location.pathname;
        if (p == '/') ML.go('chats');
        else ML.go(p.substring(1))
      }
      else
      {
        localStorage.removeItem('sessionId');
        ML.go('auth/login')
      }
    });
  }

  showDemoBox(e)
  {
    this.setState({demoBox: e.payload});
  }

  closeDemoBox()
  {
    this.setState({demoBox: null});
  }

  showMessageBox(e)
  {
    this.setState({messageBox: e.payload});
  }

  closeMessageBox()
  {
    this.setState({messageBox: null});
  }

  render()
  {
    // place here the logic of page switching
    let pages = [];

    // modals
    if (this.state.demoBox)    pages.push(h(DemoBoxModal,    {data: this.state.demoBox,    onclose: this.closeDemoBox.bind(this)    }));
    if (this.state.messageBox) pages.push(h(MessageBoxModal, {data: this.state.messageBox, onclose: this.closeMessageBox.bind(this) }));

    switch (this.state.page)
    {
      case 'loading':
        pages.push(h(LoadingPage));
        break;

      case 'login':
        pages.push(h(LoginPage));
        break;

      case 'profile':
        pages.push(h(ProfilePage));
        break;

      case 'chats':
        pages.push(h(ChatsPage, {data: this.state.chatsPageData}));
        if (this.state.widthMode)
        {
          pages.push(h(MessagesPage, {data: this.state.messagesPageData}))
        }
        break;

      case 'chat':
        pages.push(h(MessagesPage, {data: this.state.messagesPageData}));
        if (this.state.widthMode)
        {
          pages.unshift(h(ChatsPage, {data: this.state.chatsPageData}))
        }
        break;
    }

    return h('div', { id: 'app' }, pages);
  }
}

document.body.innerHTML = '';
render(h(App), document.body);