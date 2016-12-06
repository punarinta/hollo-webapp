class App extends Component
{
  constructor()
  {
    super();
    this.resizeTimer = null;
    this.state.chatsPageData = {};
    this.state.messagesPageData = {};
    this.state.pagePayload = null;
    this.state.currentDemo = null;
    this.state.widthMode = windowInnerWidth > 768;
    this.state.demoBox = null;
    this.state.messageBox = null;
    this.state.customBox = null;
    this.state.userPicker = null;
    this.state.user = null;
    this.state.busy = 1;
  }

  componentDidMount()
  {
    if (localStorage.getItem('sessionId'))
    {
      ML.sessionId = localStorage.getItem('sessionId');
    }

    if (window.Notification) Notification.requestPermission();

    window.addEventListener('hollo:demobox', (e) => this.setState({demoBox: e.payload}) );
    window.addEventListener('hollo:messagebox', (e) => this.setState({messageBox: e.payload}) );
    window.addEventListener('hollo:custombox', (e) => this.setState({customBox: e.payload}) );
    window.addEventListener('hollo:userpicker', (e) => this.setState({userPicker: e.payload}) );
    window.addEventListener('hollo:busybox', (e) => this.setState({busy: e.payload}) );
    window.addEventListener('hollo:inituser', this.initUser.bind(this));
    window.addEventListener('hollo:firebase', this.firebaseListener.bind(this));

    window.addEventListener('resize', () =>
    {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() =>
      {
        windowInnerWidth = window.innerWidth;
        console.log('restyle() has been triggered')
      }, 250);
    });

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
            this.setState({page: 'login', busy: 0});
            break;

          case 'auth/logout':
            ML.api('auth', 'logout', null, () =>
            {
              this.setState({page: 'login', busy: 0});
            });
            break;

          case 'profile':
            this.setState({page: 'profile'});
            break;

          default:
            ML.go('chats')
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
        let data = JSON.parse(event.data);
        console.log('IM', data);
        if (data.cmd == 'update')
        {
          let chat = {id: data.chatId, read: 0, reload: 1};
          ML.emit('chatupdate', {chat});
        }
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
    // use GET for better start performance
    else ML.api('auth?method=status', 0, {}, data =>
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

    parent.postMessage({cmd: 'statusBar', color: 'e2e2e2', flag: 1}, '*');
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

    // configure flags
    let s = data.user.settings;
    if (!s)
    {
      data.user.settings = {flags: CFG};
    }
    else if (!s.flags)
    {
      data.user.settings.flags = CFG;
    }
    else
    {
      let flags = s.flags;
      if (typeof s.flags.emojisReplace == 'undefined') data.user.settings.flags.emojisReplace = CFG.emojisReplace;
      if (typeof s.flags.colorAvatars == 'undefined') data.user.settings.flags.colorAvatars = CFG.colorAvatars;
      if (typeof s.flags.showNotes == 'undefined') data.user.settings.flags.showNotes = CFG.showNotes;
      if (typeof flags.emojisReplace != 'undefined') CFG.emojisReplace = flags.emojisReplace;
      if (typeof flags.colorAvatars != 'undefined') CFG.colorAvatars = flags.colorAvatars;
      if (typeof flags.showNotes != 'undefined') CFG.showNotes = flags.showNotes;
    }

    this.setState({user: data.user})
  }

  firebaseListener(e)
  {
    if (!this.state.user || e.payload.authId != this.state.user.id)
    {
      return
    }

    if (e.payload.cmd == 'logout')  ML.go('auth/logout');
    if (e.payload.cmd == 'ping')    ML.emit('messagebox', {html: 'Ping signal received'});

    if (e.payload.cmd == 'show-chat')
    {
      if (e.payload.wasTapped)
      {
        // app was off, just go to the chat
        ML.go('chat/' + e.payload.chatId);

        // app was upp, so update the chat in the list
        let chat = {id: e.payload.chatId, read: 1, reload: 1};
        ML.emit('chatupdate', {chat});
      }
    }
  }

  render()
  {
    if (maintenance)
    {
      return h('div', null, h(MessageBoxModal, {data:
      {
        html:
        '<p>Hollo, user! 🤖</p>' +
        '<p>We are making some hardware changes.</p>' +
        '<p>Few hours will we need to setup the stuff, so if you see this message for more than that, please restart the app.</p>'+
        '<p>We are terribly sorry for inconveniences!</p>'
      }}));
    }

    // place here the logic of page switching
    let user = this.state.user, pages =
    [
      h(DemoBoxModal,    {data: this.state.demoBox,    onclose: () => this.setState({demoBox: null})    }),
      h(MessageBoxModal, {data: this.state.messageBox, onclose: () => this.setState({messageBox: null}) }),
      h(UserPickerModal, {data: this.state.userPicker, onclose: () => this.setState({userPicker: null}) }),
      h(CustomBoxModal,  {data: this.state.customBox,  onclose: () => this.setState({customBox: null})  })
    ];

    switch (this.state.page)
    {
      case 'login':
        pages.push(h(LoginPage));
        break;

      case 'profile':
        pages.push(h(ProfilePage, {zIndex: 20, user}));
        pages.push(h(ChatsPage, {zIndex: 10, data: this.state.chatsPageData, user}));
        pages.push(h(MessagesPage, {zIndex: 0, data: this.state.messagesPageData, user}));
        break;

      case 'chats':
        pages.push(h(ProfilePage, {zIndex: 0, user}));
        pages.push(h(ChatsPage, {zIndex: 20, data: this.state.chatsPageData, user}));
        pages.push(h(MessagesPage, {zIndex: 10, data: this.state.messagesPageData, user}));
        break;

      case 'chat':
        pages.push(h(ProfilePage, {zIndex: 0, user}));
        pages.push(h(ChatsPage, {zIndex: 10, data: this.state.chatsPageData, user}));
        pages.push(h(MessagesPage, {zIndex: 20, data: this.state.messagesPageData, user}));
        break;
    }

    let style = {display: 'none'};
    if (this.state.busy)
    {
      style = {display: 'flex'};
      if (this.state.busy.mode == 1) style.height = 'calc(100vh - 56px)'; // mode for chats
      if (this.state.busy.mode == 2) {style.height = 'calc(100vh - 120px)'; style.top = '56px';} // mode for messages
    }

    pages.push(h('busybox', {style}, h(HolloLoaderBig, {color:'#7a4df9'})));

    return h('div', null, pages);
  }
}

document.body.innerHTML = '';
// cheapest place to compute initial window width
var windowInnerWidth = window.innerWidth;
var maintenance = 0;//!ML.getQueryVar('debug');
render(h(App), document.body);