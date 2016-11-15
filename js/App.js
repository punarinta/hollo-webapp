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
    this.state.customBox = null;
    this.state.userPicker = null;
    this.state.user = null;
  }

  componentDidMount()
  {
    if (localStorage.getItem('sessionId'))
    {
      ML.sessionId = localStorage.getItem('sessionId');
    }

    window.addEventListener('hollo:demobox', this.showDemoBox.bind(this));
    window.addEventListener('hollo:messagebox', this.showMessageBox.bind(this));
    window.addEventListener('hollo:custombox', this.showCustomBox.bind(this));
    window.addEventListener('hollo:userpicker', this.showUserPicker.bind(this));
    window.addEventListener('hollo:inituser', this.initUser.bind(this));
    window.addEventListener('hollo:firebase', this.firebaseListener.bind(this));

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


    (function mwInit(user)
    {
      ML.ws = new WebSocket(CFG.notifierUrl);
      ML.ws.onerror = function ()
      {
        // we don't care, just switch IM-mode off
        ML.ws = null
      };

      ML.ws.onopen = function ()
      {
        ML._wsOpened = 1;
        if (user)
        {
          ML.ws.send(JSON.stringify({cmd: 'online', userId: user.id}));
        }
      };

      ML.ws.onclose = function ()
      {
        if (ML._wsOpened)
        {
          ML._wsOpened = 0;
          // never close, kurwa!

          // TODO: fix this somehow
          // mwInit(AU.user);
        }
      };

      ML.ws.onmessage = function (event)
      {
        var data = JSON.parse(event.data);
        ML.emit('im', data);
      };
    })();


    let oauthCode = ML.getQueryVar('code');
    if (oauthCode)
    {
      let isMobile = window.location.pathname == '/oauth/googleMobile';

      ML.api('auth', 'processOAuthCode', {code: oauthCode, redirectUrl: CFG.redirectUrl + (isMobile?'Mobile':'')}, data =>
      {
        if (data.user)
        {
          ML.emit('inituser', {data});

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
        ML.emit('messagebox', {html: 'Google login API is down. Say what?', cb: () =>
        {
          this.setState({page: 'login'});
        }});
      });
    }
    else ML.api('auth', 'status', {}, data =>
    {
      if (data.user)
      {
        ML.emit('inituser', {data});

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

  initUser(e)
  {
    let data = e.payload.data;

    ML.sessionId = data.sessionId;
    localStorage.setItem('sessionId', data.sessionId);

    // send auth data to top frame
    parent.postMessage({cmd: 'onAuth', user: data.user}, '*');

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

    if (ML.ws)
    {
      if (ML._wsOpened)
      {
        ML.ws.send(JSON.stringify({cmd: 'online', userId: data.user.id}));
      }
      else
      {
        (function (data)
        {
          ML.ws.onopen = function ()
          {
            ML.ws.send(JSON.stringify({cmd: 'online', userId: data.user.id}));
          };
        })(data);
      }
    }

    this.setState({user: data.user})
  }

  firebaseListener(e)
  {
    if (!this.state.user || e.payload.authId != this.state.user.id)
    {
      return
    }

    if (e.payload.cmd == 'logout')
    {
      // absolute event
      ML.go('auth/logout');
    }

    if (e.payload.cmd == 'ping')
    {
      // absolute event
      ML.emit('messagebox', {html: 'Ping signal received'});
    }

    if (e.payload.cmd == 'show-chat')
    {
      if (e.payload.wasTapped)
      {
        // app was off, just go to the chat
        ML.go('chat/' + e.payload.chatId);
      }
    }
  }

  showMessageBox(e)
  {
    this.setState({messageBox: e.payload});
  }

  closeMessageBox()
  {
    this.setState({messageBox: null});
  }

  showDemoBox(e)
  {
    this.setState({demoBox: e.payload});
  }

  closeDemoBox()
  {
    this.setState({demoBox: null});
  }

  showCustomBox(e)
  {
    this.setState({customBox: e.payload});
  }

  closeCustomBox()
  {
    this.setState({customBox: null});
  }

  showUserPicker(e)
  {
    this.setState({userPicker: e.payload});
  }

  closeUserPicker()
  {
    this.setState({userPicker: null});
  }

  render()
  {
    // place here the logic of page switching
    let pages =
    [
      h(DemoBoxModal,    {data: this.state.demoBox,    onclose: this.closeDemoBox.bind(this)    }),
      h(MessageBoxModal, {data: this.state.messageBox, onclose: this.closeMessageBox.bind(this) }),
      h(UserPickerModal, {data: this.state.userPicker, onclose: this.closeUserPicker.bind(this) }),
      h(CustomBoxModal,  {data: this.state.customBox,  onclose: this.closeCustomBox.bind(this)  })
    ];

    switch (this.state.page)
    {
      case 'loading':
        pages.push(h(LoadingPage));
        break;

      case 'login':
        pages.push(h(LoginPage));
        break;

      case 'profile':
        pages.push(h(ProfilePage, {zIndex: 2, user: this.state.user}));
        pages.push(h(ChatsPage, {zIndex: 1, data: this.state.chatsPageData}));
        pages.push(h(MessagesPage, {zIndex: 0, data: this.state.messagesPageData, user: this.state.user}));
        break;

      case 'chats':
        pages.push(h(ProfilePage, {zIndex: 0, user: this.state.user}));
        pages.push(h(ChatsPage, {zIndex: 2, data: this.state.chatsPageData}));
        pages.push(h(MessagesPage, {zIndex: 1, data: this.state.messagesPageData, user: this.state.user}));
        break;

      case 'chat':
        pages.push(h(ProfilePage, {zIndex: 0, user: this.state.user}));
        pages.push(h(ChatsPage, {zIndex: 1, data: this.state.chatsPageData}));
        pages.push(h(MessagesPage, {zIndex: 2, data: this.state.messagesPageData, user: this.state.user}));
        break;
    }

    return h('div', { id: 'app' }, pages);
  }
}

document.body.innerHTML = '';
render(h(App), document.body);