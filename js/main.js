ML.loginImap = function ()
{
  var user = document.querySelector('#page-login .username').value,
      pass = document.querySelector('#page-login .password').value;

  if (!user.length || !pass.length)
  {
    alert('Both email and password are required');
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
    hasher.setHash('contacts');
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

ML.showContacts = function (full)
{
  var ul = document.querySelector('#page-contacts ul'),
      page = document.getElementById('page-contacts');

  if (full)
  {
    ML.hidePages();
    ul.innerHTML ='<li>Loading...</li>';

    page.querySelector('.head .ava img').src = ML.user.ava || '/gfx/ava.png';
    page.querySelector('.head .name').innerHTML = ML.user.name || ML.user.email.split('@')[0];
    page.querySelector('.head .email').innerHTML = ML.user.email;
    page.style.display = 'block';
  }

  ML.api('contact', 'find', {filters: [{mode:'muted', value:ML.state.muted}]}, function (data)
  {
    var html = '', name;

    for (var i in data)
    {
      name = data[i].name ? data[i].name : data[i].email;

      var ava = i < 25 ? ('https://robohash.org/' + Math.random() + '?size=48x48') : '',
        unread = data[i].read ? '' : ' class="unread"';

      html += '<li data-email="' + data[i].email + '">';
      html += '<div class="ava"><img height="48" ' + unread + 'src="' + ava + '"></div><div><div class="name">' + name + '</div><div class="email">' + data[i].email + '</div></div>';
      html += '</li>';
    }

    html += '<li data-email="new" class="new"><div class="ava"><img height="48" class="unread"></div><div><div class="name"></div><div class="email"></div></div></li>';

    ul.innerHTML = html;

    Array.prototype.forEach.call(document.querySelectorAll('#page-contacts ul li'), function (el)
    {
      ML.swipedetect(el, function (x)
      {
        if (x == 'right') el.classList.add('swiped');
        else el.classList.remove('swiped');
      });
      el.onclick = function (e)
      {
        var email = PP.par(e.target, 'li').dataset.email;
        if (email != 'new') hasher.setHash('chat/' + email);
      }
    });
  });
};

ML.showChat = function(email)
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
    var html = '';
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
      var filesHtml = '', body = data[i].body,
          whose = data[i].from == ML.user.email ? 'mine' : 'yours';

      tags = tags.concat(data[i].subject.split(' '));
      subjects.push(data[i].subject);

      // preprocess body
      var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
      body = body.replace(/(?:\r\n|\r|\n)/g, '<br />');
      body = body.replace(exp,"<a href='$1'>$1</a>");
      body = body.replace(/ -- /g," — ");

      if (data[i].files)
      {
        filesHtml += '<hr>';
        for (var fi in data[i].files)
        {
          var file = data[i].files[fi];
          filesHtml += '<a class="file" data-id="' + file.extId + '" href="#">' + file.name + '</a><br>';
        }
      }

      html += '<li class="' + whose + '"><div><div class="tag">' + data[i].subject + '</div><div>' + ML.ts(data[i].ts) + '</div><br><div class="msg">' + body + '</div><div>' + filesHtml + '</div></div></li>';
    }

    ul.innerHTML = html;

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

    Array.prototype.forEach.call(document.querySelectorAll('#page-chat li .tag'), function (el)
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
    for (var i in subjects)
    {
      html += '<li>' + subjects[i] + '</li>';
    }
    document.querySelector('#snackbar-menu-tags ul').innerHTML = html;

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
