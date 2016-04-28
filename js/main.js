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
};

ML.showLogin = function ()
{
  ML.hidePages();
  document.getElementById('page-login').style.display = 'block';
  document.getElementById('snackbar').style.display = 'none';
};

ML.showContacts = function ()
{
  var ul = document.querySelector('#page-contacts ul');
  ML.hidePages();
  ul.innerHTML ='<ul><li>Loading...</li></ul>';
  document.getElementById('page-contacts').style.display = 'block';
  // document.getElementById('snackbar').style.display = 'block';

  ML.api('contact', 'find', null, function (data)
  {
    var html = '';

    for (var i in data)
    {
      html += '<li data-email="' + data[i].email + '"><div class="name">' + data[i].name + ' (' + data[i].count + ' &#9993;)</div><div>' + data[i].email + '</div></li>';
    }

    ul.innerHTML = html;

    Array.prototype.forEach.call(document.querySelectorAll('#page-contacts ul li'), function (el)
    {
      el.onclick = function (e)
      {
        var li = e.target.nodeName == 'LI' ? e.target : e.target.parentElement;
        hasher.setHash('chat/' + li.dataset.email);
      }
    });
  });
};

ML.showChat = function(email)
{
  var ul = document.querySelector('#page-chat ul');
  ML.hidePages();
  document.querySelector('#snackbar .name').innerHTML = '';
  ul.innerHTML = '<ul><li>Loading...</li></ul>';
  document.getElementById('page-chat').style.display = 'block';
  document.getElementById('snackbar').style.display = 'block';

  ML.api('message', 'findByEmail', {email: email}, function (data)
  {
    var html = '';

    document.querySelector('#snackbar .name').innerHTML = data.contact.name;

    data = data.messages;

    for (var i in data)
    {
      var filesHtml = '', body = data[i].body,
          whose = data[i].from == ML.user.email ? 'mine' : 'yours';

      // preprocess body
      var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
      body = body.replace(/(?:\r\n|\r|\n)/g, '<br />');
      body = body.replace(exp,"<a href='$1'>$1</a>");

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
        var event = document.createEvent('HTMLEvents'),
            filter = document.querySelector('#page-chat .filter');

        filter.value = el.innerText;
        event.initEvent('keyup', true, false);
        filter.dispatchEvent(event);
      }
    });
  });
};
