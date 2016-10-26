var AU =
{
  sessionId: null,
  user: null,

  init (data)
  {
    AU.sessionId = data.sessionId;
    AU.user = data.user;
    CFG.reset();
    localStorage.setItem('sessionId', this.sessionId);

    // send auth data to top frame
    parent.postMessage({cmd: 'onAuth', user: this.user}, '*');

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
  },

  loginImap ()
  {
    var user = document.querySelector('#page-login .username').value,
        pass = document.querySelector('#page-login .password').value;

    if (!user.length || !pass.length)
    {
      ML.mbox('Input both email and password');
      return;
    }

    // disallow Gmail login here
    if (user.split('@')[1] == 'gmail.com')
    {
      ML.mbox('Use "Sign in with Google" button');
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
      AU.init(data);
      ML.go('contacts');
    });
  },

  googleStart ()
  {
    ML.api('auth', 'getOAuthToken', {redirectUrl: CFG.redirectUrl}, (data) =>
    {
      if (window.self !== window.top)
      {
        parent.postMessage({cmd: 'openUrl', url: data}, '*');
      }
      else
      {
        window.location.href = data;
      }
    });
  },

  showLogin ()
  {
    ML.hidePages();
    document.getElementById('page-login').style.display = 'block';
  }
};


// === INIT ===

(function ()
{
  let page = document.getElementById('page-login'),
      btnLogin = page.querySelector('.login');

  page.querySelector('.username').onkeydown = function (e)
  {
    // tab-assist
    if (e.keyCode == 13) page.querySelector('.password').focus();
  };
  
  page.querySelector('.google').onclick = AU.googleStart;
  btnLogin.onclick = AU.loginImap;

  if (localStorage.getItem('imapLogin'))
  {
    page.querySelector('.username').value = localStorage.getItem('imapLogin');
  }

  page.querySelector('.password').onkeyup = function (e)
  {
    btnLogin.disabled = !this.value.length;
    if (e.keyCode == 13) AU.loginImap();
  };
})();
