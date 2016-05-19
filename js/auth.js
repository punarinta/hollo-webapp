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
    ML.mbox('Both email and password are required');
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


(function ()
{
  var btnLogin = document.querySelector('#page-login .login');

  PP.onKey('#page-login .username', 13, document.querySelector('#page-login .password').focus);
  document.querySelector('#page-login .google').onclick = AU.googleStart;
  btnLogin.onclick = AU.loginImap;

  if (localStorage.getItem('imapLogin'))
  {
    document.querySelector('#page-login .username').value = localStorage.getItem('imapLogin');
  }

  document.querySelector('#page-login .password').onkeyup = function (e)
  {
    btnLogin.disabled = !this.value.length;
    if (e.keyCode == 13) AU.loginImap();
  };

})();
