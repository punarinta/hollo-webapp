(function ()
{
  ML.apiRoot = document.location.hostname.replace('app.', 'api.');

  document.getElementById('btn-logout').onclick = function ()
  {
    ML.api('auth', 'logout', null, function ()
    {
      hasher.setHash('auth/login');
    });
  };
  document.querySelector('#page-login .username').onkeydown = function (e)
  {
    if (e.keyCode == 13) document.querySelector('#page-login .password').focus();
  };
  document.querySelector('#page-login .password').onkeydown = function (e)
  {
    if (e.keyCode == 13) ML.logister();
  };
  document.querySelector('#page-login .login').onclick = ML.logister;
  document.getElementById('btn-contacts').onclick = function () { hasher.setHash('contacts'); };
  document.querySelector('#page-attach .attach').onclick = ML.attach;
  document.querySelector('#page-attach .confirm').onclick = ML.confirmAttach;

  document.querySelector('#page-contacts .filter').onkeyup = function ()
  {
    var filter = this.value.toUpperCase();
    Array.prototype.forEach.call(document.querySelectorAll('#page-contacts li'), function(el)
    {
      var name = el.getElementsByClassName('name')[0].innerHTML;
      if (name.toUpperCase().indexOf(filter) != -1) el.style.display = 'list-item';
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
  crossroads.addRoute('auth/attach', ML.showAttach);
  crossroads.addRoute('contacts', ML.showContacts);
  crossroads.addRoute('chat/{email}', function (email)
  {
    ML.showChat(email);
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

  var contextIoToken = ML.getQueryVar('contextio_token');
  if (contextIoToken)
  {
    ML.api('email', 'saveContextIdByToken', {token: contextIoToken}, function ()
    {
      hasher.setHash('contacts');
    });
  }

  // check the status
  ML.api('auth', 'status', {}, function (data)
  {
    if (data.user)
    {
      ML.sessionId = data.sessionId;
      ML.user = data.user;
      if (hasher.getHash() == '')
      {
        if (data.user.contextId) hasher.setHash('contacts');
        else hasher.setHash('auth/attach');
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
