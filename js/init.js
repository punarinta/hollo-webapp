(function ()
{
  ML.apiRoot = document.location.hostname.replace('app.', 'api.');

  // === LOGIN ===
  PP.onKey('#page-login .username', 13, document.querySelector('#page-login .password').focus);
  PP.onKey('#page-login .password', 13, ML.loginImap);
  document.querySelector('#page-login .google').onclick = ML.googleStart;
  document.querySelector('#page-login .login').onclick = ML.loginImap;

  // === FILTERS ===
  document.querySelector('#page-contacts .filter').onkeyup = function ()
  {
    var filter = this.value.toUpperCase();
    Array.prototype.forEach.call(document.querySelectorAll('#page-contacts li'), function(el)
    {
      var name = el.getElementsByClassName('name')[0].innerHTML.toUpperCase(),
          email = el.dataset.email.toUpperCase();

      if (name.indexOf(filter) != -1 || email.indexOf(filter) != -1) el.style.display = 'list-item';
      else el.style.display = 'none';
    });
  };
  /*document.querySelector('#page-chat .filter').onkeyup = function ()
  {
    var filter = this.value.toUpperCase();
    Array.prototype.forEach.call(document.querySelectorAll('#page-chat li'), function(el)
    {
      var name = el.getElementsByClassName('tag')[0].innerHTML;
      if (name.toUpperCase().indexOf(filter) != -1) el.style.display = 'list-item';
      else el.style.display = 'none';
    });
  };*/

  // === SNACKBAR ===
  Array.prototype.forEach.call(document.querySelectorAll('#snackbar .icon'), function(el)
  {
    el.onclick = function ()
    {
      var type = this.className.replace(/icon|toggled/gi, '').trim(),
          menu = document.getElementById('snackbar-menu-' + type);
      if (!menu) return;

      if (this.classList.contains('toggled'))
      {
        this.classList.remove('toggled');
        menu.style.display = 'none';
      }
      else
      {
        this.classList.add('toggled');
        menu.style.display = 'block';
      }
    }
  });

  // === COMPOSER ===
  var composerText = document.querySelector('#composer textarea');
  composerText.onclick = composerText.onfocus = function ()
  {
    var tagsBar = document.querySelector('#composer .tags');

    if (tagsBar.style.display == 'none' || !tagsBar.style.display)
    {
      Array.prototype.forEach.call(document.querySelectorAll('#composer .tag'), function (el) { el.classList.remove('sel'); });
    }
    tagsBar.style.display = 'block';
  };
  composerText.onkeydown = function (e)
  {
    if (e.keyCode == 27)
    {
      document.querySelector('#composer .tags').style.display = 'none';
    }
  };

  
  // PATHS
  crossroads.addRoute('auth/login', ML.showLogin);
  crossroads.addRoute('contacts', ML.showContacts);
  crossroads.addRoute('chat/{email}', function (email)
  {
    ML.showChat(email);
  });
  crossroads.addRoute('auth/logout', function ()
  {
    ML.api('auth', 'logout', null, function ()
    {
      hasher.setHash('auth/login');
    });
  });

  function parseHash(newHash/*, oldHash*/)
  {
    crossroads.parse(newHash);
  }

  hasher.initialized.add(parseHash);
  hasher.changed.add(parseHash);

  if (localStorage.getItem('sessionId'))
  {
    ML.sessionId = localStorage.getItem('sessionId');
  }

  // NO API CALLS ABOVE THIS LINE

  var oauthCode = ML.getQueryVar('code');
  if (oauthCode)
  {
    ML.api('auth', 'processOAuthCode', {code: oauthCode}, function (data)
    {
      if (data.user)
      {
        ML.sessionId = data.sessionId;
        ML.user = data.user;

        localStorage.setItem('sessionId', ML.sessionId);

        // remove '?code=...'
        window.history.pushState('home', 'Home', '/');

        if (document.location.hash == '')
        {
          hasher.setHash('contacts');
        }
      }
      else
      {
        localStorage.removeItem('sessionId');
        hasher.setHash('auth/login');
      }
    });
  }

  // check the status
  else ML.api('auth', 'status', {}, function (data)
  {
    if (data.user)
    {
      ML.sessionId = data.sessionId;
      ML.user = data.user;

      if (document.location.hash == '')
      {
        hasher.setHash('contacts');
      }
    }
    else
    {
      localStorage.removeItem('sessionId');
      hasher.setHash('auth/login');
    }

    hasher.init();
  });
})();
