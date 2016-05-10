(function ()
{
  // === LOGIN ===
  var btnLogin = document.querySelector('#page-login .login');
  PP.onKey('#page-login .username', 13, document.querySelector('#page-login .password').focus);
  document.querySelector('#page-login .google').onclick = ML.googleStart;
  btnLogin.onclick = ML.loginImap;
  if (localStorage.getItem('imapLogin'))
  {
    document.querySelector('#page-login .username').value = localStorage.getItem('imapLogin');
  }
  document.querySelector('#page-login .password').onkeyup = function (e)
  {
    btnLogin.disabled = !this.value.length;
    if (e.keyCode == 13) ML.loginImap();
  };

  // === FILTERS ===
  document.querySelector('#page-contacts .filter').onkeyup = function ()
  {
    var filter = this.value.toUpperCase();

    switch (filter)
    {
      case 'LOGOUT':
        hasher.setHash('auth/logout');
        break;

      case 'VERSION':
        this.value = __DATE__;
        break;
    }
    
    var any = 0;

    Array.prototype.forEach.call(document.querySelectorAll('#page-contacts li'), function(el)
    {
      var name = el.getElementsByClassName('name')[0].innerHTML.toUpperCase(),
          email = el.dataset.email.toUpperCase();

      if (email == 'new') return;

      if (name.indexOf(filter) != -1 || email.indexOf(filter) != -1) { el.style.display = 'list-item'; any = 1 }
      else el.style.display = 'none';
    });

    var ny = document.querySelector('#page-contacts ul li.new'),
        r = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!any && r.test(this.value))
    {
      ny.style.display = 'block';
      ny.getElementsByClassName('name')[0].innerHTML = this.value;
    }
    else
    {
      ny.style.display = 'none';
      ny.getElementsByClassName('name')[0].innerHTML = '';
    }
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

      if (type == 'back') hasher.setHash('contacts');
      if (!menu) return;

      var toggled = this.classList.contains('toggled');

      // close all others
      Array.prototype.forEach.call(document.querySelectorAll('#snackbar .icon'), function(el)
      {
        el.classList.remove('toggled');
      });
      Array.prototype.forEach.call(document.getElementsByClassName('snackbar-menu'), function(el)
      {
        el.style.display = 'none';
      });

      if (!toggled)
      {
        this.classList.add('toggled');
        menu.style.display = 'block';
      }
    }
  });
  
  // === hollo'd / muted ===
  var btnHolloed = document.getElementById('show-holloed'),
      btnMuted = document.getElementById('show-muted');
  
  btnHolloed.onclick = function ()
  {
    btnHolloed.classList.add('sel');
    btnMuted.classList.remove('sel');
    ML.state.muted = 0;
    ML.showContacts(0);
  };
  btnMuted.onclick = function ()
  {
    btnMuted.classList.add('sel');
    btnHolloed.classList.remove('sel');
    ML.state.muted = 1;
    ML.showContacts(0);
  };


  // prevent scrolling of the main screen by files list

  var tch, filesList = document.querySelector('#snackbar-menu-files ul');

  function scrollListener(e)
  {
    var up = 0, r1 = this.getBoundingClientRect(), r2;
    if (typeof e.wheelDelta == "undefined")
    {
      if (tch.clientY < e.changedTouches[0].clientY) up = 1;
    }
    else
    {
      if (e.wheelDelta > 0) up = 1;
    }

    if (up)
    {
      r2 = this.querySelector('li:first-child').getBoundingClientRect();
      if (r1.top < r2.top) e.preventDefault();
    }
    else
    {
      r2 = this.querySelector('li:last-child').getBoundingClientRect();
      if (r1.bottom > r2.bottom) e.preventDefault();
    }
  }

  filesList.addEventListener('touchstart', function(e) { tch = e.touches[0] });
  filesList.addEventListener('touchmove', scrollListener);
  filesList.addEventListener('wheel', scrollListener);


  // === COMPOSER ===
  var composerText = document.querySelector('#composer textarea');
  composerText.onclick = function ()
  {
    composerText.classList.add('focused');
  };

  composerText.onkeyup = function (e)
  {
    if (e.keyCode == '32')
    {
      var that = this, w = this.value.trim().split(' ').slice(-1)[0].toLowerCase();
      if (typeof EMJ[w] != 'undefined')
      {
        var em = document.createElement('div');
        em.innerText = EMJ[w];
        em.style.color = 'red';
        em.dataset.w = w;
        setTimeout(function(o)
        {
          o.parentNode.removeChild(o);
        }, 5000, em);
        em.onclick = function ()
        {
          // replace the last occurrence of a word with an emoji
          var pat = new RegExp('(\\b' + this.dataset.w + '\\b)(?!.*\\b\\1\\b)', 'i');
          that.value = that.value.replace(pat, this.innerText);
          that.focus();
        };
        document.querySelector('#page-chat .emojis').appendChild(em);
      }
    }
  };

  autosize(composerText);
  composerText.addEventListener('autosize:resized', function(e)
  {
    var h = parseInt(e.target.style.height, 10), cmp = document.getElementById('composer');
    cmp.style.height = (h + 5) + 'px';
    cmp.querySelector('.emojis').style.bottom = (h + 21) + 'px';
  });

  document.querySelector('#page-chat').onclick = function (e)
  {
    // 'ndf' for 'no defocus'
    if (e.target.classList.contains('ndf') || e.target.tagName.toLowerCase() == 'textarea') return;
    composerText.classList.remove('focused');
  };


  // PATHS
  crossroads.addRoute('auth/login', ML.showLogin);
  crossroads.addRoute('contacts', function() {ML.showContacts(1)});
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

  if (ML.getQueryVar('preload'))
  {
    var i, im, f = ['/gfx/ava.png'];
    for (i in f)
    {
      im = new Image();
      im.src = f[i];
    }
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
