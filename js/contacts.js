var CO =
{
  offset: 0,
  more : 0,
  loaded: 0
};

CO.resetFilter = function ()
{
  var f = document.querySelector('#page-contacts .head .filter');
  f.value = '';
  f.dispatchEvent(new Event('keyup'));
};

CO.xname = function(chat, shorty)
{
  var count = chat.users.length, name, nc;

  if (count > 1)
  {
    name = shorty ? [] : ['You'];
    for (var n = 0, user; n < count; n++)
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
    name = chat.users[0].name ? chat.users[0].name : chat.users[0].email.split('@')[0];
    nc = name.split(' ');
    nc = nc.length == 1 ? nc[0].charAt(0) : (nc[0].charAt(0) + nc[1].charAt(0));
  }

  return [name, nc]
};

CO.add = function (data)
{
  var html = '';

  for (var i in data)
  {
    var unread = data[i].read ? '' : ' unread';
    var xname = CO.xname(data[i]), name = xname[0], nc = xname[1];

    html +=
      '<li data-id="' + data[i].id + '">' +
      '<div class="ava"><div class="img' + unread + '" style="background:' + ML.colorHash(data[i].id + '') + '">' + nc + '</div></div>' +
      '<div class="hujava"><div class="name">' + name + '</div><div class="email">' + (data[i].lastMsg || '&mdash;') + '</div></div>' +
      '</li>' +
      '<div class="shadow shad-' + data[i].id + '"><div>' + (ML.state.muted?'un':'') + 'mute</div><div class="markas">mark<br>as ' + (unread?'':'un') + 'read</div></div>';
  }

  document.querySelector('#page-contacts ul').innerHTML += html;

  /*for (i in data)
  {
    ML.grava(data[i].email, function (d)
    {
      if (!d) return;
      var s = document.getElementById('img-gr-' + d.hash);
      if (s)
      {
        s.style.backgroundImage = 'url(' + d.thumbnailUrl + '?s=48)';
        s.innerHTML = '';
      }
    });
  }*/
};

CO.show = function (mode)
{
  var page = document.getElementById('page-contacts'),
      ul = page.querySelector('ul');

  mode = (CO.loaded == 7) ? mode : 7;

  if (mode & 1)
  {
    ML.hidePages();
    page.style.display = ML.state.widthMode ? 'inline-block' : 'block';
  }

  if (mode & 2)
  {
    ul.innerHTML = '<li>Loading...</li>';
    page.querySelector('.head .ava img').src = AU.user.ava || '/gfx/ava.png';
    page.querySelector('.head .name').innerHTML = AU.user.name || AU.user.email.split('@')[0];
    page.querySelector('.head .email').innerHTML = AU.user.email;
  }

  if (mode & 4)
  {
    CO.offset = 0;

    var filter = page.querySelector('.head .filter').value,
        filters = [{mode:'muted', value:ML.state.muted}];

    if (filter.length) filters.push({mode:'email', value:filter});

    ML.api('chat', 'find', {pageStart:CO.offset, pageLength:25, filters:filters, sortBy: CFG._('contact-sort-ts')?'lastTs':'email' }, function (data)
    {
      if (filter.length && !data.length && ML.isEmail(filter))
      {
        // filter is ON, but no results found => offer to create a new one
        ul.innerHTML = '<li data-id="new" class="new"><div class="ava"><div class="new img"></div></div><div><div class="name">' + filter + '</div><div class="email"></div></div></li>';
      }
      else
      {
        ul.innerHTML = '';
      }
      
      CO.add(data);

      if (data.length == 25)
      {
        CO.more = 1;
      }

      // load the first contact on laptop
      if (ML.state.widthMode == 1 && data.length && !MS.loaded)
      {
        ML.go('chat/' + data[0].email, data[0].id);
      }
    });
  }

  CO.loaded |= mode;
};


// === INIT ===

(function ()
{
  // === SWIPES ===
  var item, shadow, startX, startY, swipe = 0, action = 0, blockSwipe = 0,
    conts = document.querySelector('#page-contacts ul'),
    vw = ML.state.widthMode ? 360 : window.innerWidth, threshold = vw * .3;

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
      item.style.transform = 'translateX(' + distX + 'px)';
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
      }
      else if (Math.abs(distX) > 16 && !blockSwipe)
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

    if (swipe)
    {
      swipe = 0;

      // animate back
      setTimeout(function (item, shadow)
      {
        item.classList.remove('travel');
        item.style.position = 'static';
        shadow.style.display = 'none';
        shadow.style.opacity = 0;
        item.style.transform = 'translateX(0)';
      }, 400, item, shadow);

      item.classList.add('travel');

      var id = item.dataset.id;

      switch (action)
      {
        case 1:
          item.style.transform = 'translateX(' + vw + 'px)';

          ML.api('chat', 'update', {id: id, muted: !ML.state.muted - 0}, function ()
          {
            setTimeout(function (e)
            {
              e.parentNode.removeChild(e);
            }, 800, item);
            item.style.height = 0;
            item.style.opacity = 0;
          });
          break;

        case -1:
          item.style.transform = 'translateX(-' + vw + 'px)';

          ML.api('chat', 'update', {id: id, read: item.querySelector('.img').classList.contains('unread') - 0}, function ()
          {
            var cl = item.querySelector('.img').classList;
            cl.toggle('unread');
            setTimeout(function (cl, shadow)
            {
              shadow.querySelector('.markas').innerHTML = 'mark<br>as ' + (cl.contains('unread')?'':'un') + 'read';
            }, 400, cl, shadow);
          });
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
      CO.resetFilter();
      ML.go('chat/' + id);
    }
    else
    {
      var email = document.querySelector('#page-contacts .filter').value;
      CO.resetFilter();

      ML.api('chat', 'add', {emails:[email]}, function (data)
      {
        ML.go('chat/' + data.id);
      });
    }
  };

  document.onscroll = function ()
  {
    if (!CO.more) return;

    var el = document.querySelector('#page-contacts ul li:nth-last-child(2)');

    if (el && el.getBoundingClientRect().bottom < screen.height + 50)
    {
      CO.more = 0;
      CO.offset += 25;

      console.log('Contacts fetch at offset ' + CO.offset);

      var filter = document.querySelector('#page-contacts .head .filter').value, filters = [{mode:'muted', value:ML.state.muted}];
      if (filter.length) filters.push({mode:'email', value:filter});

      ML.api('chat', 'find', { pageStart: CO.offset, pageLength: 25, filters: filters, sortBy: CFG._('contact-sort-ts')?'lastTs':'email' }, function (data)
      {
        CO.add(data);
        if (data.length == 25) CO.more = 1;
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
    CO.show(4);
  };
  
  btnMuted.onclick = function ()
  {
    btnMuted.classList.add('sel');
    btnHolloed.classList.remove('sel');
    ML.state.muted = 1;
    CO.show(4);
  };
})();
