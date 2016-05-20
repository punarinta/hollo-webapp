var CO =
{
    offset: 0,
    more : 0
};

CO.resetFilter = function ()
{
  var f = document.querySelector('#page-contacts .head .filter');
  f.value = '';
  f.dispatchEvent(new Event('keyup'));
};

CO.add = function (data)
{
  var html = '', name;

  for (var i in data)
  {
    name = data[i].name ? data[i].name : data[i].email;

    var unread = data[i].read ? '' : ' unread', nc = name.split(' ');

    nc = nc.length == 1 ? nc[0].charAt(0) : (nc[0].charAt(0) + nc[1].charAt(0));

    html +=
      '<li data-email="' + data[i].email + '" data-id="' + data[i].id + '">' +
      '<div class="pre">' + (ML.state.muted?'un':'') + 'mute</div>' +
      '<div class="ava"><div class="img' + unread + '" id="img-gr-' + md5(data[i].email) + '" style="background:' + ML.colorHash(data[i].email) + '">' + nc + '</div></div>' +
      '<div class="hujava"><div class="name">' + name + '</div><div class="email">' + data[i].email + '</div></div>' +
      '<div class="post">mark as<br>' + (unread?'':'un') + 'read</div>' +
      '</li>';
  }

  document.querySelector('#page-contacts ul').innerHTML += html;

  for (i in data)
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
  }
};

CO.show = function (full)
{
  var page = document.getElementById('page-contacts'),
      ul = page.querySelector('ul');

  if (full)
  {
    ML.hidePages();
    ul.innerHTML = '<li>Loading...</li>';

    page.querySelector('.head .ava img').src = AU.user.ava || '/gfx/ava.png';
    page.querySelector('.head .name').innerHTML = AU.user.name || AU.user.email.split('@')[0];
    page.querySelector('.head .email').innerHTML = AU.user.email;
    page.style.display = 'block';
  }

  CO.offset = 0;

  ML.api('contact', 'find', {pageStart:CO.offset, pageLength:25, filters: [{mode:'muted', value:ML.state.muted}]}, function (data)
  {
    // that's a first load, so keep it clean
    ul.innerHTML = '<li data-email="new" class="new"><div class="ava"><div class="new img unread"></div></div><div><div class="name"></div><div class="email"></div></div></li>';

    CO.add(data);

    if (data.length == 25)
    {
      CO.more = 1;
    }
  });
};


// === INIT ===

(function ()
{
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
        ML.api('contact', 'update', {id:id, read:li.querySelector('.img').classList.contains('unread') - 0}, function ()
        {
          var cl = li.querySelector('.img').classList;
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

    if (email != 'new')
    {
      CO.resetFilter();
      ML.go('chat/' + email, ds.id);
    }
    else
    {
      email = document.querySelector('#page-contacts .filter').value;
      CO.resetFilter();

      ML.api('contact', 'add', {email:email}, function (data)
      {
        ML.go('chat/' + email, data.id);
      });
    }
  };

  document.onscroll = function ()
  {
    if (!CO.more) return;

    var el = document.querySelector('#page-contacts ul li:last-child');

    if (el && el.getBoundingClientRect().bottom < screen.height + 50)
    {
      CO.more = 0;
      CO.offset += 25;

      console.log('Contacts fetch at offset ' + CO.offset);

      ML.api('contact', 'find', { pageStart: CO.offset, pageLength: 25, filters: [{mode:'muted', value:ML.state.muted}] }, function (data)
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
    CO.show(0);
  };
  
  btnMuted.onclick = function ()
  {
    btnMuted.classList.add('sel');
    btnHolloed.classList.remove('sel');
    ML.state.muted = 1;
    CO.show(0);
  };
})();
