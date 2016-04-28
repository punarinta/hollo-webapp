(function ()
{
  ML.apiRoot = document.location.hostname.replace('app.', 'api.');

  /*document.getElementById('btn-logout').onclick = function ()
  {
    ML.api('auth', 'logout', null, function ()
    {
      hasher.setHash('auth/login');
    });
  };*/

  PP.onKey('#page-login .username', 13, document.querySelector('#page-login .password').focus);
  PP.onKey('#page-login .password', 13, ML.loginImap);

  document.querySelector('#page-login .google').onclick = ML.googleStart;
  document.querySelector('#page-login .login').onclick = ML.loginImap;
  //document.getElementById('btn-contacts').onclick = function () { hasher.setHash('contacts'); };

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
  document.querySelector('#page-chat .filter').onkeyup = function ()
  {
    var filter = this.value.toUpperCase();
    Array.prototype.forEach.call(document.querySelectorAll('#page-chat li'), function(el)
    {
      var name = el.getElementsByClassName('tag')[0].innerHTML;
      if (name.toUpperCase().indexOf(filter) != -1) el.style.display = 'list-item';
      else el.style.display = 'none';
    });
  };

  function showTags()
  {
    var tagsBar = document.querySelector('#composer .tags');

    if (tagsBar.style.display == 'none' || !tagsBar.style.display)
    {
      Array.prototype.forEach.call(document.querySelectorAll('#composer .tag'), function (el) { el.classList.remove('sel'); });
    }
    tagsBar.style.display = 'block';
  }

  var composerText = document.querySelector('#composer textarea');
  composerText.onclick = composerText.onfocus = showTags;
  composerText.onkeydown = function (e)
  {
    if (e.keyCode == 27)
    {
      document.querySelector('#composer .tags').style.display = 'none';
    }
  };

  Array.prototype.forEach.call(document.querySelectorAll('#composer .tag'), function(el)
  {
    el.onclick = function ()
    {
      Array.prototype.forEach.call(document.querySelectorAll('#composer .tag'), function (el) { el.classList.remove('sel'); });
      $(this).addClass('sel');

      if ($(this).hasClass('new'))
      {
        var tag = prompt('New tag:', 'hollotag'),
            clone = document.querySelector('#composer .tag').cloneNode(false);
        clone.innerText = '#' + tag;
        document.querySelector('#composer .tags').appendChild(clone);
      }
    };
  });

  // setup path dispatcher
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
