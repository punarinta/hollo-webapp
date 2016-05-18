ML.loginImap = function ()
{
  var user = document.querySelector('#page-login .username').value,
      pass = document.querySelector('#page-login .password').value;

  if (!user.length || !pass.length)
  {
    ML.mbox('Both email and password are required');
    return;
  }

  ML.api('auth', 'loginImap',
  {
    'identity': user,
    'credential': pass
  },
  function (data)
  {
    // memorize login
    localStorage.setItem('imapLogin', user);

    ML.sessionId = data.sessionId;
    ML.user = data.user;
    localStorage.setItem('sessionId', ML.sessionId);
    ML.go('contacts');
  });
};

ML.googleStart = function ()
{
  ML.api('auth', 'getOAuthToken', {}, function (data)
  {
     window.location.href = data;
  });
};

ML.hidePages = function ()
{
  Array.prototype.forEach.call(document.getElementsByClassName('page'), function (el) { el.style.display = 'none' });
  document.getElementById('snackbar').style.display = 'none';
  Array.prototype.forEach.call(document.getElementsByClassName('snackbar-menu'), function(el)
  {
    el.style.display = 'none';
  });
};

ML.showLogin = function ()
{
  ML.hidePages();
  document.getElementById('page-login').style.display = 'block';
};

ML.addContacts = function (data)
{
  var html = '', name;

  for (var i in data)
  {
    name = data[i].name ? data[i].name : data[i].email;

    var unread = data[i].read ? '' : ' class="unread"';

    html +=
      '<li data-email="' + data[i].email + '" data-id="' + data[i].id + '">' +
      '<div class="pre">' + (ML.state.muted?'un':'') + 'mute</div>' +
      '<div class="ava"><img src="/gfx/ava.png" id="img-gr-' + md5(data[i].email) + '" height="48" ' + unread + '></div>' +
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
      if (s) s.setAttribute('src', d.thumbnailUrl);
    });
  }
};

ML.showContacts = function (full)
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
    ul.innerHTML = '<li data-email="new" class="new"><div class="ava"><img class="unread"></div><div><div class="name"></div><div class="email"></div></div></li>';
    ML.addContacts(data);
    if (data.length == 25) ML.state.moreContacts = 1;
  });
};

ML.showChat = function (email)
{
  var ul = document.querySelector('#page-chat ul');
  ML.hidePages();
  ul.innerHTML = '<li>Loading...</li>';
  document.querySelector('#snackbar .name').innerHTML = '';
  document.getElementById('snackbar').style.display = 'block';
  document.getElementById('page-chat').style.display = 'block';

  ML.load('modules/emojis');

  ML.api('message', 'findByEmail', {email: email}, function (data)
  {
    var html = '', subj;
    var tags = [], subjects = [];

    ML.contact = data.contact;
    ML.contact.email = email;

    var name = ML.contact.name;
    if (name)
    {
      name = name.split(' ');
      if (name.length > 1)
      {
        name = name[0] + ' ' + name[1].charAt(0);
      }
    }
    else
    {
      name = email.split('@')[0];
    }

    document.querySelector('#snackbar .name').innerHTML = name;

    data = data.messages;

    for (var i in data)
    {
      if (!data[i].from.id) data[i].from = ML.user;

      var filesHtml = '',
          body = data[i].body,
          whose = data[i].from.email == ML.user.email ? 'mine' : 'yours',
          sName = data[i].from.name ? data[i].from.name : data[i].from.email;

      tags = tags.concat(data[i].subject.split(' '));
      subjects.push(data[i].subject);

      if (!body) body = '[HTML content]';

      // preprocess body
      var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
      body = body.replace(/(?:\r\n|\r|\n)/g, '<br />');
      body = body.replace(exp,"<a href='$1'>$1</a>");
      body = body.replace(/ -- /g, ' — ');

      if (data[i].files)
      {
        filesHtml += '<hr>';
        for (var fi in data[i].files)
        {
          var file = data[i].files[fi];
          filesHtml += '<a class="file" data-id="' + file.extId + '" href="#">' + file.name + '</a><br>';
        }
      }

      subj = data[i].subject.charAt(0).toUpperCase() + data[i].subject.slice(1);

      if (!subj.length) subj = '—';

      var nc = sName.split(' ');
      nc = nc.length == 1 ? nc[0].charAt(0) : (nc[0].charAt(0) + nc[1].charAt(0));

      html +=
        '<li data-id="' + data[i].id + '" class="' + whose + '">' +
        '<div>' +
          '<div class="white">' +
            '<div class="cap">' + subj + '</div>' +
            '<div class="msg">' + body + '</div>' +
          '</div>' +
          '<div class="foot"><div class="ava">' + nc + '</div><div class="ts">' + ML.ts(data[i].ts) + '</div></div>' +
        '</div>' +
        '</li>';
    }

    ul.innerHTML = html;

    document.querySelector('#composer .cap').innerText = subj;

    Array.prototype.forEach.call(document.querySelectorAll('#page-chat li a'), function (el)
    {
      el.onclick = function ()
      {
        ML.api('file', 'getFileUrl', {extId: el.dataset.id}, function (url)
        {
          window.location = url;
        });
        return false;
      };
    });

    Array.prototype.forEach.call(document.querySelectorAll('#page-chat li .cap'), function (el)
    {
      el.onclick = function ()
      {
        console.log('TODO: filter on click');
        /*var event = document.createEvent('HTMLEvents'),
            filter = document.querySelector('#page-chat .filter');

        filter.value = el.innerText;
        event.initEvent('keyup', true, false);
        filter.dispatchEvent(event);*/
      }
    });


    // fill in subjects
    html = '';
    subjects = ML.uniques(subjects, true);
    for (i in subjects)
    {
      html += '<li>' + subjects[i] + '</li>';
    }
    document.querySelector('#snackbar-menu-tags ul').innerHTML = html;
    document.querySelector('#composer .subjects').innerHTML = html;
    
    // connect subject picker
    Array.prototype.forEach.call(document.querySelectorAll('#composer .subjects li'), function (el)
    {
      el.classList.add('ndf');
      el.onclick = function ()
      {
        document.querySelector('#composer .cap').innerText = this.innerText;
        document.querySelector('#composer textarea').focus();
        document.querySelector('#composer .subjects').classList.remove('opened');
      }
    });

    document.querySelector('#snackbar-menu-more .mute').innerText = ML.contact.muted ? 'Unmute' : 'Mute';

    // scrolling hack
    setTimeout(function (ul)
    {
      ul.scrollIntoView(false);
    },100,ul);

    ML.loadFiles(email)
  });
  
  ML.loadFiles = function (email)
  {
    var fileList = document.querySelector('#snackbar-menu-files ul');
    fileList.innerHTML = 'Loading ...';
    
    ML.api('file', 'findByEmail', {email: email, withImageUrl: false /*true*/}, function (files)
    {
      files = [1,2,3,4,5,6,7]
      var url, html = '';
      for (var i in files)
      {
      //  if (files[i].type.indexOf('image/') != -1) url = files[i].url;
      /*  else*/ url = 'https://ssl.webpack.de/lorempixel.com/300/300/?' + Math.random();

        html += '<li><div class="img" style="background-image:url(\''+ url + '\')"></div>'
          + '<div class="bar"><div></div><div></div>'
          +'</div></li>';
      }
      document.querySelector('#snackbar-menu-files ul').innerHTML = html;
    })
  }
};
