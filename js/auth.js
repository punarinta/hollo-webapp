var AU =
{
  sessionId: null,
  user: null
};

AU.init = function (data)
{
  AU.sessionId = data.sessionId;
  AU.user = data.user;
  CFG.reset();
  localStorage.setItem('sessionId', AU.sessionId);

  if (typeof mixpanel != 'undefined')
  {
    mixpanel.identify(data.user.email);
    mixpanel.people.set(
    {
      "$email": data.user.email,
      "$name": data.user.name,
      // "$last_login": new Date(),
      "hollo_id": data.user.id
    });
  }
  else
  {
    window.mixpanel = {track: function () {}}
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
};

AU.loginImap = function ()
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
  function (data)
  {
    // memorize login
    localStorage.setItem('imapLogin', user);
    AU.init(data);
    ML.go('contacts');
  });
};

AU.googleStart = function ()
{
  ML.api('auth', 'getOAuthToken', {redirectUrl: CFG.redirectUrl}, function (data)
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
};

AU.showLogin = function ()
{
  ML.hidePages();
  document.getElementById('page-login').style.display = 'block';
};


// === INIT ===

(function ()
{
  var page = document.getElementById('page-login'),
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
