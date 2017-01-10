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
    this.state.widthMode = $windowInnerWidth > 768;
    this.state.demoBox = null;
    this.state.messageBox = null;
    this.state.customBox = null;
    this.state.userPicker = null;
    this.state.user = null;
    this.state.busy = 0;
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
        $windowInnerWidth = window.innerWidth;
        console.log('restyle() has been triggered')
      }, 250);
    });

    // === ROUTER ===
    window.onpopstate = (e) =>
    {
      if (!e.state) return;
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
            let chatsPageData = e.state.data;
            if (typeof chatsPageData == 'undefined') chatsPageData = {muted: 0};
            this.setState({page: 'chats', chatsPageData});
            break;

          case 'auth/login':
            this.setState({page: 'login', busy: 0});
            break;

          case 'auth/logout':
            ML.api('auth', 'logout', null, () =>
            {
              this.setState({page: 'login', busy: 0});
              if ($platform == 1)
              {
                window.plugins.googleplus.logout();
                FCMPlugin.unsubscribeFromTopic('user-' + this.state.user.id);
              }
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

    var that = this;

    (function mwInit(user)
    {
      ML.ws = new WebSocket(CFG.notifierUrl);
      ML.ws.onerror = () =>
      {
        // we don't care, just switch IM-mode off
        ML.ws = null
      };

      ML.ws.onopen = () =>
      {
        ML._wsOpened = 1;
        if (user)
        {
          ML.ws.send(JSON.stringify({cmd: 'auth:online', userId: user.id}));
        }
      };

      ML.ws.onclose = () =>
      {
        if (ML._wsOpened)
        {
          ML._wsOpened = 0;

          // keep the connection alive all the time
          mwInit(user);
        }
      };

      ML.ws.onmessage = (event) =>
      {
        // this works only if the app is ON
        let data = JSON.parse(event.data);
        console.log('IM', data);

        if (data.uid)
        {
          if (ML.sysMuids.length > 32) ML.sysMuids.shift();
          if (ML.sysMuids.indexOf(data.uid) != -1) return;
          ML.sysMuids.push(data.uid);
        }

        if (data.cmd == 'sys:ping')
        {
          if (!that.notification('Ping signal received'))
          {
            ML.emit('messagebox', {html: 'Ping signal received'});
          }
        }

        // Firebase messaging is on, so skip duplicate activities
        // if ($firebaseOn) return;

        if (data.cmd == 'chat:update')
        {
          ML.api('chat', 'getAllData', {chatId: data.chatId}, (json) =>
          {
            $.U.set(null, json.users);
            $.C.set(that.state.user, null, json.chats);
          });
        }
      };
    })();


    let oauthCode = ML.getQueryVar('code');
    if (oauthCode)
    {
      ML.api('auth', 'processOAuthCode', {code: oauthCode, redirectUrl: CFG.redirectUrl}, data =>
      {
        if (data.user)
        {
          history.replaceState({}, 'Hollo!', '/');
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
        ML.emit('messagebox', {html: 'Google login API is down. Say what?', cb: () =>
        {
          this.setState({page: 'login'});
        }});
      },
      () =>
      {
        // this is for desktop clients
        document.location.href = document.location.origin + document.location.pathname;
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

    if ($platform == 1 && window.StatusBar)
    {
      StatusBar.show();
    }
  }

  notification (message)
  {
    if (window.Notification && Notification.permission === 'granted')
    {
      let icon = 'https://app.hollo.email/favicon/notification.png';

      if (navigator.serviceWorker && $platform)
      {
        navigator.serviceWorker.register('modules/null.js').then(function (registration)
        {
          registration.showNotification(message, {icon});
        })
      }
      else
      {
        new Notification('Good news everyone!', {image: icon, icon});
      }

      return true;
    }

    return false;
  }

  initUser(e)
  {
    let data = e.payload.data;

    ML.sessionId = data.sessionId;
    localStorage.setItem('sessionId', data.sessionId);

    // show intro modal if necessary
    if (Math.floor(Date.now() / 1000) < data.user.created + 60)
    {
      let children =
      [
        h('div', {onclick: (e) => {e.stopPropagation()}},
          h('h1', null, _('HI_WELCOME')),
          h('div', null, _('HI_GIMME_5')),
          h('hr'),
          h(Svg, {model: 'email', fill: '#212121'}),
          h('h1', null, 'Inbox'),
          h('div', null, _('HI_INBOX')),
          h(Svg, {style: {marginTop: '48px'}, model: 'muted', fill: '#212121'}),
          h('h1', null, 'Muted'),
          h('div', null, _('HI_MUTED'))
        ),
        h('button', {disabled: 'disabled'}, _('HI_SYNCING'))
      ];
      ML.emit('custombox', {className: 'intro-modal', children});

      setTimeout(() =>
      {
        // activate the button
        let button = document.querySelector('.intro-modal button');
        button.innerText = _('HI_SYNCED');
        button.removeAttribute('disabled')
      }, 5000)
    }

    if ($platform == 1 && window.FCMPlugin)
    {
      FCMPlugin.onNotification
      (
        data =>
        {
          console.log('Firebase message:', data);
          ML.emit('firebase', data);
        },
        msg =>
        {
          console.log('Firebase on!', msg);
        },
        err => console.log('Firebase error:', err)
      );

      console.log('FCM: subscribe to user-' + data.user.id);
      FCMPlugin.subscribeToTopic('user-' + data.user.id);
    }

    if (typeof mixpanel != 'undefined' && !mixpanel.off)
    {
      mixpanel.identify(data.user.email);
      mixpanel.people.set(
      {
        '$email'  : data.user.email,
        '$name'   : data.user.name,
        'hollo_id': data.user.id,
        'lang'    : CFG.locale
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
        ML.ws.send(JSON.stringify({cmd: 'auth:online', userId: data.user.id}));
      }
      else
      {
        (function (data)
        {
          ML.ws.onopen = function ()
          {
            ML.ws.send(JSON.stringify({cmd: 'auth:online', userId: data.user.id}));
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

    this.setState({user: data.user});

    // load all user chats
    $.C.load(data.user);
  }

  firebaseListener(e)
  {
    if (!this.state.user || e.payload.authId != this.state.user.id)
    {
      // no login — no Firebase
      return
    }

    // $firebaseOn = true;

    if (e.payload.uid)
    {
      if (ML.sysMuids.length > 32) ML.sysMuids.shift();
      // if the user taps the notification it means the app was in the bg and did not get data via IM
      if (ML.sysMuids.indexOf(e.payload.uid) != -1 && !e.payload.wasTapped) return;
      ML.sysMuids.push(e.payload.uid);
    }

    if (e.payload.cmd == 'auth:logout')  ML.go('auth/logout');
    if (e.payload.cmd == 'sys:ping')     ML.emit('messagebox', { html: 'Ping signal received' });
    if (e.payload.cmd == 'chat:update')
    {
      ML.api('chat', 'getAllData', {chatId: e.payload.chatId}, (json) =>
      {
        $.U.set(null, json.users);
        $.C.set(this.state.user, null, json.chats);

        if (e.payload.wasTapped)
        {
          // app was OFF, just go to the chat
          ML.go('chat/' + e.payload.chatId);
        }
      });
    }
  }

  render()
  {
    if ($maintenance)
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
        pages.push(h(MessagesPage, {zIndex: 20, data: this.state.messagesPageData, user, popped: Math.random()}));
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

// setup global vars
var $windowInnerWidth = 360,
    $maintenance = 0, //!ML.getQueryVar('debug'),
    $platform = 0/*,
    $firebaseOn = false*/;

function onDeviceReady()
{
  if (window.StatusBar)
  {
    StatusBar.hide();
    StatusBar.backgroundColorByHexString('e2e2e2');
  }

  document.body.innerHTML = '';

  // cheapest place to compute initial window width
  $windowInnerWidth = window.innerWidth;
  $platform = window.self === window.top ? 0 : 2;

  /*
      Platforms:
      0 - web browser
      1 - mobile app
      2 - desktop app
  */

  if (window.cordova)
  {
    $platform = 1;

    if (window.plugins.intent) window.plugins.intent.setNewIntentHandler( intent =>
    {
      console.log('Intent:', intent);
      if (intent.action.indexOf('SEND') != -1)
      {
        ML.emit('messagebox', {html: 'Sending files feature will be fully supported in the next version. Stay tuned!'});
      }
    });
  }

  render(h(App), document.body);
}

document.addEventListener('deviceready', onDeviceReady, false);

if (CFG.local)
{
  onDeviceReady();
}
