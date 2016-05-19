var AU =
{
  sessionId: null,
  user:
  {
    id: null,
    email: null
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

  ML.api('auth', 'loginImap',
  {
    'identity': user,
    'credential': pass
  },
  function (data)
  {
    // memorize login
    localStorage.setItem('imapLogin', user);

    AU.sessionId = data.sessionId;
    AU.user = data.user;
    localStorage.setItem('sessionId', AU.sessionId);
    ML.go('contacts');
  });
};

AU.googleStart = function ()
{
  ML.api('auth', 'getOAuthToken', {}, function (data)
  {
    window.location.href = data;
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
