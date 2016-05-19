ML.loginImap = function ()
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

    ML.sessionId = data.sessionId;
    ML.user = data.user;
    localStorage.setItem('sessionId', ML.sessionId);
    ML.go('contacts');
  });
};

ML.googleStart = function ()
{
  ML.api('auth', 'getOAuthToken', {}, function (data)
  {
     window.location.href = data;
  });
};

ML.hidePages = function ()
{
  Array.prototype.forEach.call(document.getElementsByClassName('page'), function (el) { el.style.display = 'none' });
  document.getElementById('snackbar').style.display = 'none';
  Array.prototype.forEach.call(document.getElementsByClassName('snackbar-menu'), function(el)
  {
    el.style.display = 'none'
  });
};

ML.showLogin = function ()
{
  ML.hidePages();
  document.getElementById('page-login').style.display = 'block';
};
