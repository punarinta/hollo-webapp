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
  var head = document.querySelector('#page-contacts .head');
  head.querySelector('.filter').onkeyup = function ()
  {
    var filter = this.value.toUpperCase(), cmd = filter.split(' '), that = this;

    head.classList.toggle('mode2', !!filter.length);

    switch (cmd.slice(-1).pop())
    {
      case 'LOGOUT':
        ML.go('auth/logout');
        break;

      case 'VERSION':
        this.value = __DATE__;
        break;

      case 'INCARNATE':
        ML.api('auth', 'incarnate', {userId:cmd[0]}, function (data)
        {
          ML.sessionId = data.sessionId;
          ML.user = data.user;
          localStorage.setItem('sessionId', ML.sessionId);
          that.value = '';
          ML.go('contacts');
        });
        break;
    }
    
    var any = 0;

    Array.prototype.forEach.call(document.querySelectorAll('#page-contacts li'), function(el)
    {
      var name = el.getElementsByClassName('name')[0].innerHTML.toUpperCase(),
          email = el.dataset.email.toUpperCase();

      if (email == 'new') return;

      if (name.indexOf(filter) != -1 || email.indexOf(filter) != -1) { el.style.display = 'flex'; any = 1 }
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

  head.querySelector('.clear').onclick = ML.resetContactFilter;
  
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

      if (type == 'back') ML.go('contacts');
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

  document.querySelector('#snackbar-menu-more .mute').onclick = function ()
  {
    var t = this;
    ML.api('contact', 'update', {id:ML.contact.id, muted:!ML.contact.muted}, function ()
    {
      ML.contact.muted = !ML.contact.muted;
      t.innerText = ML.contact.muted ? 'Unmute' : 'Mute';
    });
  };

  document.querySelector('#snackbar-menu-more .unread').onclick = function ()
  {
    ML.api('contact', 'update', {id:ML.contact.id, read:0}, function ()
    {
      document.querySelector('#snackbar .icon.more').classList.remove('toggled');
      document.getElementById('snackbar-menu-more').style.display = 'none';
    });
  };


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
  
  
  // === MESSAGE BOX ===
  var mbox = document.getElementById('mbox');
  mbox.querySelector('.btn.ok').onclick = function ()
  {
    mbox.style.display = 'none';
    ML._mbox(0);
  };


  // === SWIPES ===
  var swipe, startX, startY, conts = document.querySelector('#page-contacts ul');

  conts.addEventListener('touchstart', function (e)
  {
    var t = e.changedTouches[0];
    swipe = 0;
    startX = t.pageX;
    startY = t.pageY;
  });

  conts.addEventListener('touchmove', function (e)
  {
    var prevSwipe = swipe, t = e.changedTouches[0], distX = t.pageX - startX, distY = t.pageY - startY;

    if (distX > 50) swipe = 1;
    else if (Math.abs(distX) < 50) swipe = 0;
    else if (distX < -50) swipe = -1;

    if (swipe != prevSwipe)
    {
      var li = PP.par(e.target, 'li');
      if (swipe == 1) { li.classList.remove('swipedL'); li.classList.add('swipedR') }
      else if (swipe == 0) { li.classList.remove('swipedR'); li.classList.remove('swipedL') }
      else if (swipe == -1) { li.classList.remove('swipedR'); li.classList.add('swipedL') }
    }
    if (Math.abs(distX) > Math.abs(distY)) e.preventDefault();
  });

  conts.addEventListener('touchend', function (e)
  {
    if (swipe)
    {
      var li = PP.par(e.target, 'li'), id = li.dataset.id;
      if (swipe == 1)
      {
        ML.api('contact', 'update', {id:id, muted:!ML.state.muted - 0}, function ()
        {
          setTimeout(function (e)
          {
            e.parentNode.removeChild(li);
          }, 800, li);
          li.style.height = 0;
          li.style.opacity = 0;
        });
      }
      else
      {
        ML.api('contact', 'update', {id:id, read:li.querySelector('img').classList.contains('unread') - 0}, function ()
        {
          var cl = li.querySelector('img').classList;
          cl.toggle('unread');
          li.querySelector('.post').innerHTML = 'mark as<br>' + (cl.contains('unread')?'':'un') + 'read';
        });
      }
      li.classList.remove('swipedR');
      li.classList.remove('swipedL');
    }
  });

  // === CONTACT LIST ===
  conts.onclick = function (e)
  {
    var ds = PP.par(e.target, 'li').dataset,
        email = ds.email;

    ML.resetContactFilter();

    if (email != 'new')
    {
      ML.go('chat/' + email, ds.id);
    }
    else
    {
      email = document.querySelector('#page-contacts .filter').value;

      ML.api('contact', 'add', {email:email}, function (data)
      {
        ML.go('chat/' + email, data.id);
      });
    }
  };

  document.onscroll = function ()
  {
    if (!ML.state.moreContacts) return;

    var el = document.querySelector('#page-contacts ul li:last-child');

    if (el && el.getBoundingClientRect().bottom < screen.height + 50)
    {
      ML.state.moreContacts = 0;
      ML.state.contactsOffset += 25;

      console.log('Contacts fetch at offset ' + ML.state.contactsOffset);

      ML.api('contact', 'find', {pageStart:ML.state.contactsOffset, pageLength:25, filters: [{mode:'muted', value:ML.state.muted}]}, function (data)
      {
        ML.addContacts(data);
        if (data.length == 25) ML.state.moreContacts = 1;
      });
    }
  };
  

  // === COMPOSER ===
  var cmp = document.getElementById('composer'),
      cmpText = cmp.querySelector('textarea');

  cmpText.onclick = function ()
  {
    cmp.classList.add('focused');
  };

  cmpText.onkeyup = function (e)
  {
    // left trim the contents
    this.value = this.value.replace(/^\s+/, '');

    if (/[^a-zA-Z0-9-_]/.test(this.value.slice(-1)) && e.keyCode > 31)
    {
      var that = this, w = this.value.trim().split(' ').slice(-1)[0].toLowerCase().replace(/[_\W]+/g, '');
      if (typeof EMJ[w] != 'undefined')
      {
        var em = document.createElement('div');
        em.innerText = EMJ[w];
        em.dataset.w = w;
        setTimeout(function(o)
        {
          if (o.parentNode) o.parentNode.removeChild(o);
        }, 5000, em);
        em.onclick = function ()
        {
          // replace the last occurrence of a word with an emoji
          var pat = new RegExp('(\\b' + this.dataset.w + '\\b)(?!.*\\b\\1\\b)', 'i');
          that.value = that.value.replace(pat, this.innerText);
          em.parentNode.removeChild(em);
          that.focus();
        };
        document.querySelector('#page-chat .emojis').appendChild(em);
      }
    }
  };

  autosize(cmpText);

  cmpText.addEventListener('autosize:resized', function (e)
  {
    var h = parseInt(e.target.style.height, 10), f = ML._upl.length ? 78 : 0;

    cmp.style.height = (h + 21) + 'px';
    cmp.querySelector('.emojis').style.bottom = f + (h + 53) + 'px';
    cmp.querySelector('.head').style.bottom = f + (h + 21) + 'px';
    cmp.querySelector('.send').style.bottom = (f + h)/2 + 'px';
    cmp.querySelector('.subjects').style.bottom = f + (h + 54) + 'px';
    cmpText.style.bottom = f + 'px';
  });

  Array.prototype.forEach.call(cmp.querySelectorAll('*'), function(el)
  {
    el.classList.add('ndf');
  });

  document.onclick = function (e)
  {
    // 'ndf' for 'no defocus'
    if (e.target.classList.contains('ndf')) return;
    cmp.classList.remove('focused');
  };

  cmp.querySelector('.send').onclick = function ()
  {
    // send a message
    var msg = cmpText.value, subj = cmp.querySelector('.cap').innerText, msgId = null;

    if (!msg.length)
    {
      ML.mbox('You didn\'t input any message');
      return;
    }

    // try to find last message id
    var lis = document.querySelectorAll('#page-chat li:last-child');
    if (lis.length)
    {
      msgId = lis[0].dataset.id;
    }

    console.log('body:', msg);
    console.log('subject:', subj);
    console.log('messageId:', msgId);

    ML.api('message', 'send', {body: msg, messageId:msgId, subject: subj}, function (json)
    {
      console.log('result:', json);
    });
  };

  cmp.querySelector('.picker').onclick = function ()
  {
    cmp.querySelector('.subjects').classList.toggle('opened');
    cmpText.focus();
  };

  cmp.querySelector('#upload').onchange = function (e)
  {
    var files = e.target.files;

    for (var i = 0, f; f = files[i]; i++)
    {
      // Only process image files.
      if (!f.type.match('image.*'))
      {
        continue;
      }

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function (theFile)
      {
        return function (e)
        {
          // Render thumbnail.
          var span = document.createElement('span');
          span.innerHTML = '<img src="' + e.target.result + '" title="' + encodeURI(theFile.name) + '"/>';

          document.getElementById('uploaded').insertBefore(span, null);

          console.log('FileReader event:', e);
          ML._upl.push(e.target.result);
          document.querySelector('#composer textarea').dispatchEvent(new Event('autosize:update'));
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
  };


  // === ROUTER ===
  window.onpopstate = function (e)
  {
    var r = e.state.route, rs = r.split('/');
    console.log('Route: ' + e.state.route);
    if (rs[0] == 'chat')
    {
      ML.showChat(rs[1], e.state.data);
    }
    else
    {
      switch (r)
      {
        case 'contacts':
          ML.showContacts(1);
          break;
        case 'auth/login':
          ML.showLogin();
          break;
        case 'auth/logout':
          ML.api('auth', 'logout', null, function ()
          {
            ML.go('auth/login');
          });
          break;
      }
    }
  };

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
      ML.sessionId = data.sessionId;
      ML.user = data.user;

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
