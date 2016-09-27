function busy(isBusy)
{
  document.getElementById('busybox').classList.toggle('hidden', !isBusy)
}

ML.hidePages = function ()
{
  Array.prototype.forEach.call(document.getElementsByClassName('page'), function (el)
  {
    // console.log(el.id, ML.state.widthMode, el.className);
    if (ML.state.widthMode == 0 || el.classList.contains('fullhide'))
    {
      el.style.display = 'none';
      document.getElementById('snackbar').style.display = 'none';
    }
  });
  Array.prototype.forEach.call(document.getElementsByClassName('snackbar-menu'), function(el)
  {
    el.style.display = 'none'
  });
  ML.demo(0)
};

// === INIT ===

(function ()
{
  window.onresize = function ()
  {
    var mode = ML.state.widthMode;
    ML.state.widthMode = window.innerWidth > 768;
    if (mode != ML.state.widthMode)
    {
      window.location.reload()
    }
  };

  // === FILTERS ===
  var head = document.querySelector('#page-contacts .head'), prevEmailFilter = '';
  head.querySelector('.filter').onkeyup = function ()
  {
    var filter = this.value.toUpperCase(), cmd = filter.split(' '), that = this;

    head.classList.toggle('mode2', !!filter.length);

    switch (cmd[0])
    {
      case 'LOGOUT':
        this.value = '';
        ML.go('auth/logout');
        break;

      case 'CSS-01':
        busy(1);
        break;

      case 'SOCKET':
        ML.ws.send(JSON.stringify({cmd: 'ping'}));
        break;

      case 'INCARNATE':
        if (cmd.length < 2)
          break;
        this.value = '';
        ML.api('auth', 'incarnate', { userId: cmd[1] }, function (data)
        {
          AU.init(data);
          that.value = '';
          ML.go('contacts');
        });
        break;
    }

    if (prevEmailFilter != filter)
    {
      prevEmailFilter = filter;
      CO.show(4);
    }
  };

  head.querySelector('.clear').onclick = CO.resetFilter;


  // === SNACKBAR ===
  var snackbar = document.getElementById('snackbar'),
      snackdrop = document.getElementById('snackbar-menu-more');

  Array.prototype.forEach.call(snackbar.querySelectorAll('.sub'), function(el)
  {
    el.onclick = function ()
    {
      var type = this.className.replace(/icon|sub|toggled/gi, '').trim(),
          menu = document.getElementById('snackbar-menu-' + type),
          toggled = this.classList.contains('toggled');

      // close all others
      Array.prototype.forEach.call(snackbar.querySelectorAll('.sub'), function(el)
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
/*
        if (type == 'roster')
        {
          CR.onShow()
        }*/
      }
    }
  });

  snackbar.querySelector('.back').onclick = function () { ML.go('contacts', 1) };

  snackdrop.querySelector('.mute').onclick = function ()
  {
    var t = this;
    ML.api('chat', 'update', {id:MS.chat.id, muted:!MS.chat.muted}, function ()
    {
      MS.chat.muted = !MS.chat.muted;
      t.innerText = MS.chat.muted ? 'Unmute' : 'Mute';
    });
  };

  var closeSnackbar = function ()
  {
    snackbar.querySelector('.icon.more').classList.remove('toggled');
    snackdrop.style.display = 'none';
  };

  snackdrop.querySelector('.unread').onclick = function ()
  {
    ML.api('chat', 'update', {id:MS.chat.id, read:0}, closeSnackbar);
  };

  snackdrop.querySelector('.rename').onclick = function ()
  {
    var mbox = ML.mbox('<input class="texty" value="' + (MS.chat.name || '') + '"/>', 1, function (ret)
    {
      if (ret)
      {
        var name = mbox.querySelector('input').value;
        ML.api('chat', 'update', { id: MS.chat.id, name: name }, function ()
        {
          if (name.length)
          {
            MS.chat.name = name;
            snackbar.querySelector('.roster').innerText = CO.xname(MS.chat)[0]
          }
        });
      }
    });

    mbox.querySelector('input').focus();

    closeSnackbar();
  };

  snackdrop.querySelector('.delete').onclick = function ()
  {
    ML.mbox('Are you sure?', 1, function (code)
    {
      if (code)
      {
        ML.mbox('feature disabled until release');

        // TODO: uncomment before release
        
        ML.api('chat', 'leave', {id: MS.chat.id}, function ()
        {
          ML.go('contacts')
        });
      }
    });

    closeSnackbar();
  };

  document.getElementById('snackbar-menu-tags').onclick = function (e)
  {
    if (e.target.tagName == 'LI')
    {
      MS.filter(e.target.innerText);
    }
  };

  document.querySelector('#msgs-filter .close').onclick = function ()
  {
    MS.filter(0)
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

  Array.prototype.forEach.call(document.querySelectorAll('.prevent-sub-scroll'), function (el)
  {
    el.addEventListener('touchstart', function (e) { tch = e.touches[0] });
    el.addEventListener('touchmove', scrollListener);
    el.addEventListener('wheel', scrollListener);
  });

  filesList.onclick = function (e)
  {
    if (!e.target.classList.contains('img')) return;

    ML.demo(e.target.dataset.url, e.target.dataset.mime)
  };


  // === MESSAGE BOX ===
  var mbox = document.getElementById('mbox');

  Array.prototype.forEach.call(mbox.querySelectorAll('.btn'), function (el)
  {
    el.onclick = function ()
    {
      mbox.style.display = 'none';
      ML._mbox(el.dataset.code - 0);
    }
  });

  // === DEMO BOX ===
  document.getElementById('demo').querySelector('.close').onclick = function ()
  {
    ML.demo(0)
  };


  // === ROUTER ===
  window.onpopstate = function (e)
  {
    var r = e.state.route, rs = r.split('/');

    if (rs[0] == 'chat')
    {
      MS.show(rs[1]);
    }
    else
    {
      switch (r)
      {
        case 'contacts':
          if (AU.user) CO.show(e.state.data || 7);
          break;
        
        case 'auth/login':
          AU.showLogin();
          break;

        case 'auth/logout':
          ML.api('auth', 'logout', null, function ()
          {
            ML.go('auth/login');
          });
          break;

        case 'settings':
          CFG.show();
          break;

        case 'demo':
          ML.go('contacts');
      }
    }
  };

  if (localStorage.getItem('sessionId'))
  {
    AU.sessionId = localStorage.getItem('sessionId');
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

  // connect to notifier

  (function mwInit(user)
  {
    ML.ws = new WebSocket(CFG.notifierUrl);
    ML.ws.onerror = function ()
    {
      // we don't care, just switch IM-mode off
      ML.ws = null
    };

    ML.ws.onopen = function ()
    {
      ML._wsOpened = 1;
      if (user)
      {
        ML.ws.send(JSON.stringify({cmd: 'online', userId: user.id}));
      }
    };

    ML.ws.onclose = function ()
    {
      if (ML._wsOpened)
      {
        ML._wsOpened = 0;
        // never close, kurwa!
        mwInit(AU.user);
      }
    };

    ML.ws.onmessage = function (event)
    {
      var data = JSON.parse(event.data);

      switch (data.cmd)
      {
        case 'update':
          console.log('update', data);

          if (MS.chat && data.chatId == MS.chat.id)
          {
            // we're inside the target chat, fetch messages
            ML.api('message', 'getLastChatMessage', {chatId: data.chatId}, function (data)
            {
              MS.add([data], 'bottom');
            });
          }
          else
          {
            // mark the target chat as unread and move it to the top
            var li = CO.page.querySelector('li[data-id="' + data.chatId + '"] .img');
            li.classList.add('unread');
          }
          break;

        case 'pong':
          ML.mbox('Echo');
          break;
      }
    };
  })();


  // NO API CALLS ABOVE THIS LINE

  var oauthCode = ML.getQueryVar('code');
  if (oauthCode)
  {
    ML.api('auth', 'processOAuthCode', {code: oauthCode, redirectUrl: CFG.redirectUrl}, function (data)
    {
      if (data.user)
      {
        AU.init(data);
        ML.go('contacts')
      }
      else
      {
        localStorage.removeItem('sessionId');
        ML.go('auth/login');
      }
    });
  }

  // check the status
  else ML.api('auth', 'status', {}, function (data)
  {
    if (data.user)
    {
      AU.init(data);

      var p = document.location.pathname;
      if (p == '/') ML.go('contacts');
      else ML.go(p.substring(1))
    }
    else
    {
      localStorage.removeItem('sessionId');
      ML.go('auth/login')
    }
  });
})();
