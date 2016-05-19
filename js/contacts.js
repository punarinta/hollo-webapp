var CO =
{
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

    var unread = data[i].read ? '' : ' unread',
      nc = name.split(' '),
      ncc = parseInt(md5(data[i].email).substr(0, 6), 16),
      b = ncc & 0xFF, g = (ncc >> 8) & 0xFF, r = ncc >> 16;

    nc = nc.length == 1 ? nc[0].charAt(0) : (nc[0].charAt(0) + nc[1].charAt(0));
    ncc = [(r >> 1) + 96, (g >> 1) + 96, (b >> 1) + 96].join(',');

    html +=
      '<li data-email="' + data[i].email + '" data-id="' + data[i].id + '">' +
      '<div class="pre">' + (ML.state.muted?'un':'') + 'mute</div>' +
      '<div class="ava"><div class="img' + unread + '" id="img-gr-' + md5(data[i].email) + '" style="background:rgb(' + ncc + ')">' + nc + '</div></div>' +
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
  var ul = document.querySelector('#page-contacts ul'),
    page = document.getElementById('page-contacts');

  if (full)
  {
    ML.hidePages();
    ul.innerHTML = '<li>Loading...</li>';

    page.querySelector('.head .ava img').src = ML.user.ava || '/gfx/ava.png';
    page.querySelector('.head .name').innerHTML = ML.user.name || ML.user.email.split('@')[0];
    page.querySelector('.head .email').innerHTML = ML.user.email;
    page.style.display = 'block';
  }

  ML.api('contact', 'find', {pageStart:ML.state.contactsOffset, pageLength:25, filters: [{mode:'muted', value:ML.state.muted}]}, function (data)
  {
    // that's a first load, so keep it clean
    ul.innerHTML = '<li data-email="new" class="new"><div class="ava"> <div class="new img unread"></div> </div><div><div class="name"></div><div class="email"></div></div></li>';
    CO.add(data);
    if (data.length == 25) ML.state.moreContacts = 1;
  });
};