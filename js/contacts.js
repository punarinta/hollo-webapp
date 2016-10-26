var CO =
{
  offset: 0,
  more : 0,
  loaded: 0,
  yPos: 0,
  page: document.getElementById('page-contacts'),

  resetFilter ()
  {
    var f = CO.page.querySelector('.head .filter');
    f.value = '';
    f.dispatchEvent(new Event('keyup'));
  },

  clearName (text)
  {
    return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').replace(/\s{2,}/g, ' ').split('\\"').join('"')
  },

  xname (chat)
  {
    var n, user, name, nc, count = chat.users.length;

    if (count > 1)
    {
      name = [];
      for (n = 0; n < count; n++)
      {
        if (chat.users[n].name)
          user = chat.users[n].name.split(' ')[0];
        else
          user = chat.users[n].email.split('@')[0].split('.')[0];

        name.push(user.charAt(0).toUpperCase() + user.slice(1));
      }

      name = name.join(', ');
      nc = '+' + count;
    }
    else
    {
      name = chat.users[0].name ? CO.clearName(chat.users[0].name) : chat.users[0].email.split('@')[0];
      nc = name.split(' ');
      nc = nc.length == 1 ? nc[0].charAt(0) : (nc[0].charAt(0) + nc[1].charAt(0));
      if (chat.name) name = chat.name
    }

    return [name, nc]
  },

  add (data)
  {
    var i, html = '';

    for (i in data)
    {
      var unread = data[i].read ? '' : 'unread',
          [name, nc] = CO.xname(data[i]),
          email = data[i].users[0].email,
          lastMsg = data[i].lastMsg || '',
          extraAva = data[i].users.length > 1 ? '' : `url('/files/avatars/${email}')`;

      lastMsg = lastMsg.replace(/\[sys:fwd\]/g, '➡️').replace(/(<([^>]+)>)/ig, '').substring(0, 60);

      if (lastMsg.charAt(0) == '{')
      {
        // for now we only support calendar invites
        lastMsg = '📅';
      }

      if (data[i].users.length < 2)
      {
        (function (id, email)
        {
          var im = new Image;
          im.onload = function ()
          {
            var s = CO.page.querySelector(`li[data-id="${id}"] .img`);
            if (s) s.innerHTML = '';
          };
          im.src = '/files/avatars/' + email;
        })(data[i].id, email);
      }

      html +=
        `<li data-id="${data[i].id}">
          <div class="ava">
              <div id="img-gr-${md5(email)}" class="img ${unread}" style="background:${ML.colorHash(email + '')} ${extraAva}">${nc}</div>
          </div>
          <div class="hujava">
            <div class="name">${name}</div>
            <div class="email">${lastMsg || '&mdash;'}</div>
          </div>
        </li>
        <div class="shadow shad-${data[i].id}">
          <div>${ML.state.muted ? 'un' : ''}mute</div>
          <div class="markas">mark<br>as ${unread ? '' : 'un'}read</div>
        </div>`;
    }

    for (i in data)
    {
      ML.grava(data[i].users[0].email, (d) =>
      {
        if (!d) return;
        var s = document.getElementById('img-gr-' + d.hash);
        if (s)
        {
          s.style.backgroundImage = `url(${d.thumbnailUrl}?s=48)`;
          s.innerHTML = '';
        }
      });
    }

    return html
  },

  show (mode)
  {
    var ul = CO.page.querySelector('ul');

    // noinspection JSBitwiseOperatorUsage
    mode = CO.loaded & 7 ? mode : 7;

    MS.chat = null;

    // noinspection JSBitwiseOperatorUsage
    if (mode & 1)
    {
      // scrolling hack
      setTimeout( (ul) =>
      {
        ul.scrollTop = document.body.scrollTop = CO.yPos || 0;
      }, 100, ul);

      ML.hidePages();
      CO.page.style.display = ML.state.widthMode ? 'inline-block' : 'block';
    }

    // noinspection JSBitwiseOperatorUsage
    if (mode & 2)
    {
      // busy(1);
      CO.page.querySelector('.head .ava img').src = AU.user.ava || '/gfx/ava.png';
      CO.page.querySelector('.head .name').innerHTML = AU.user.name || AU.user.email.split('@')[0];
      CO.page.querySelector('.head .email').innerHTML = AU.user.email;
    }

    // noinspection JSBitwiseOperatorUsage
    if (mode & 8)
    {
      ul.classList.add('stand-still')
    }

    // noinspection JSBitwiseOperatorUsage
    if (mode & 4)
    {
      if (mode & 16)
      {
        busy(1);
      }

      // reset it for this mode
      CO.offset = 0;

      var filter = CO.page.querySelector('.head .filter').value,
          filters = [{mode:'muted', value:ML.state.muted}], html = '';

      if (filter.length)
      {
        filters.push({mode:'email', value:filter});
      }

      ML.api('chat', 'find', {pageStart: 0, pageLength: CO.pageLength, filters: filters, sortBy: CFG._('contact-sort-ts')?'lastTs':'email'}, function (data)
      {
        if (!filter.length && !data.length)
        {
          ul.innerHTML = '<div class="loading">We are now syncing<br>your app<br>with your mailbox</div>';
          return
        }

        if (filter.length && !data.length && ML.isEmail(filter))
        {
          // filter is ON, but no results found => offer to create a new one
          html =
            `<li data-id="new" class="new">
              <div class="ava">
                <div class="new img"></div>
                </div>
              <div>
                <div class="name">${filter}</div>
                <div class="email"></div>
              </div>
            </li>`;
        }

        ul.innerHTML = html + CO.add(data);

        if (data.length == CO.pageLength)
        {
          CO.more = 1;
        }

        busy(0);

        // load the first contact on laptop
        if (ML.state.widthMode == 1 && data.length && !MS.loaded)
        {
          ML.go('chat/' + data[0].id);
        }
      });
    }

    CO.loaded |= mode;
  }
};

// === INIT ===

(function ()
{
  // === SWIPES ===
  var item, shadow, startX, startY, swipe = 0, action = 0, blockSwipe = 0, pull = 0,
      conts = CO.page.querySelector('ul'),
      vw = ML.state.widthMode ? 360 : window.innerWidth, threshold = vw * .3;

  // fit 2 screens, ceiling-aligned
  CO.pageLength = Math.ceil(2.5 * (screen.height - 176) / 72);

  conts.addEventListener('touchstart', function (e)
  {
    var t = e.changedTouches[0];
    startX = t.pageX;
    startY = t.pageY;
    item = PP.par(e.target, 'li');
    shadow = conts.querySelector('.shad-' + item.dataset.id);

    if (item.tagName != 'LI')
    {
      blockSwipe = 1;
    }
  });

  conts.addEventListener('touchmove', function (e)
  {
    var t = e.changedTouches[0], distX = t.pageX - startX;

    if (swipe)
    {
      // item.style.left = distX + 'px';
      item.style.transform = `translateX(${distX}px)`;
      e.preventDefault();

      if (distX > threshold) action = 1;
      else if (Math.abs(distX) < threshold) action = 0;
      else if (distX < -threshold) action = -1;
    }
    else
    {
      var distY = t.pageY - startY;

      if (Math.abs(distY) > 16)
      {
        blockSwipe = 1;

        if (distY > 72)
        {
          pull = 1;
          distY = Math.min(distY, 216);
          conts.style.transform = `translateY(${distY}px)`;
        }
      }
      else if (Math.abs(distX) > 32 && !blockSwipe)
      {
        swipe = 1;
        shadow.style.display = 'block';
        item.style.position = 'absolute';
        shadow.style.opacity = 1;
      }
    }
  });

  conts.addEventListener('touchend', function ()
  {
    blockSwipe = 0;

    conts.style.transform = `translateY(0)`;

    if (pull)
    {
      pull = 0;
      CO.show(20);
    }

    if (swipe)
    {
      swipe = 0;

      // animate back
      setTimeout( () =>
      {
        item.classList.remove('travel');
        item.style.position = 'static';
        shadow.style.display = 'none';
        shadow.style.opacity = 0;
        item.style.transform = 'translateX(0)';
      }, 400);

      item.classList.add('travel');

      var id = item.dataset.id;

      switch (action)
      {
        case 1:
          ML.api('chat', 'update', {id: id, muted: !ML.state.muted - 0});

          setTimeout( () =>
          {
            item.parentNode.removeChild(item);
          }, 800);

          item.style.transform = `translateX(${vw}px)`;
          item.style.height = 0;
          item.style.opacity = 0;
          mixpanel.track('Chat - swipe muting');
          break;

        case -1:
          ML.api('chat', 'update', {id: id, read: item.querySelector('.img').classList.contains('unread') - 0});

          item.style.transform = `translateX(-${vw}px)`;

          var cl = item.querySelector('.img').classList;
          cl.toggle('unread');

          setTimeout( () =>
          {
            shadow.querySelector('.markas').innerHTML = `mark<br>as ${cl.contains('unread')?'':'un'}read`;
          }, 400);
          mixpanel.track('Chat - swipe reading');
          break;

        default:
          item.style.transform = 'translateX(0)';
      }
    }
  });

  // === CONTACT LIST ===
  conts.onclick = function (e)
  {
    var ds = PP.par(e.target, 'li').dataset, id = ds.id;

    if (id != 'new')
    {
      mixpanel.track('Chat - enter');
      CO.resetFilter();
      ML.go('chat/' + id);
    }
    else
    {
      var email = CO.page.querySelector('.filter').value;
      CO.resetFilter();

      mixpanel.track('Chat - add');

      ML.api('chat', 'add', {emails:[email]}, (data) =>
      {
        ML.go('chat/' + data.id);
      });
    }
  };

  document.onscroll = function ()
  {
    if (!CO.more || CO.page.style.display == 'none')
    {
      return;
    }

    var el = CO.page.querySelector('ul li:nth-last-child(2)');

    if (el && el.getBoundingClientRect().bottom < screen.height + 50)
    {
      CO.more = 0;
      CO.offset += CO.pageLength;

      // console.log('Contacts fetch at offset ' + CO.offset);

      var filter = CO.page.querySelector('.head .filter').value, filters = [{mode:'muted', value:ML.state.muted}];
      if (filter.length)
      {
        filters.push({mode:'email', value:filter});
      }

      mixpanel.track('Chat - get more');

      ML.api('chat', 'find', { pageStart: CO.offset, pageLength: CO.pageLength, filters: filters, sortBy: CFG._('contact-sort-ts')?'lastTs':'email' }, (data) =>
      {
        CO.page.querySelector('ul').innerHTML += CO.add(data);
        if (data.length == CO.pageLength) CO.more = 1;
      });
    }
  };

  // === hollo'd / muted ===
  
  var btnHolloed = document.getElementById('show-holloed'),
      btnMuted = document.getElementById('show-muted');

  btnHolloed.onclick = function ()
  {
    btnHolloed.classList.add('sel');
    btnMuted.classList.remove('sel');
    ML.state.muted = 0;
    mixpanel.track('Sys - show holloed');
    CO.show(4);
  };
  
  btnMuted.onclick = function ()
  {
    btnMuted.classList.add('sel');
    btnHolloed.classList.remove('sel');
    ML.state.muted = 1;
    mixpanel.track('Sys - show muted');
    CO.show(4);
  };
})();
