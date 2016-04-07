ML.logister = function ()
{
  var user = document.querySelector('#page-login .username').value,
      pass = document.querySelector('#page-login .password').value;

  if (!user.length || !pass.length)
  {
    alert('Both email and password are required');
  }

  ML.api('auth', 'logister',
  {
    'identity': user,
    'credential': pass
  },
  function (data)
  {
    ML.sessionId = data.sessionId;
    ML.user = data.user;

    localStorage.setItem('sessionId', ML.sessionId);

    if (data.user.contextId) hasher.setHash('contacts');
    else hasher.setHash('auth/attach');
  });
};

ML.attach = function ()
{
  var email = document.querySelector('#page-attach .email').value;

  ML.api('email', 'discover',
  {
    'email': email
  },
  function (data)
  {
    if (data.oauth)
    {
      // OAuth procedure
      window.location.href = data.url;
    }
    else
    {
      // prefill IMAP forms
      document.querySelector('#page-attach .email').disabled = true;
      document.querySelector('#page-attach .extra-options').style.display = 'block';
      document.querySelector('#page-attach .server').value = data.server;
      document.querySelector('#page-attach .port').value = data.port;
      document.querySelector('#page-attach .username').value = data.username;
      document.querySelector('#page-attach .attach').style.display = 'none';
      document.querySelector('#page-attach .confirm').style.display = 'block';
      document.querySelector('#page-attach .password').focus();
    }
  });
};

ML.confirmAttach = function ()
{
  var email = document.querySelector('#page-attach .email').value,
      username = document.querySelector('#page-attach .username').value,
      password = document.querySelector('#page-attach .password').value,
      server = document.querySelector('#page-attach .server').value,
      port = document.querySelector('#page-attach .port').value;

  ML.api('email', 'attach',
  {
    'email': email,
    'username': username,
    'password': password,
    'server': server,
    'port': port
  },
  function ()
  {
    hasher.setHash('contacts');
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
};

ML.showAttach = function ()
{
  ML.hidePages();
  document.querySelector('#page-attach .extra-options').style.display = 'none';
  document.querySelector('#page-attach .email').value = ML.user.email;
  document.getElementById('page-attach').style.display = 'block';
};

ML.showContacts = function ()
{
  var ul = document.querySelector('#page-contacts ul');
  ML.hidePages();
  ul.innerHTML ='<ul><li>Loading...</li></ul>';
  document.getElementById('page-contacts').style.display = 'block';

  ML.api('contact', 'find', null, function (data)
  {
    var html = '';

    for (var i in data)
    {
      html += '<li data-email="' + data[i].email + '"><div class="name">' + data[i].name + '</div><div>' + data[i].email + '</div></li>';
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
  document.querySelector('#page-chat .interlocutor').innerHTML = email;
  ul.innerHTML = '<ul><li>Loading...</li></ul>';
  document.getElementById('page-chat').style.display = 'block';

  ML.api('message', 'findByEmail', {email: email}, function (data)
  {
    var html = '';

    for (var i in data)
    {
      var filesHtml = '', body = data[i].body,//.content,
        whose = data[i].from == email ? 'yours' : 'mine';

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
          filesHtml += '<a target="_blank" class="file" href="/api/file?method=fetch&extId=' + file.extId + '&type='
            + file.type + '">' + file.name + '</a><br>';
        }
      }

      html += '<li class="' + whose + '"><div><div class="tag">' + data[i].subject + '</div><br><div class="msg">' + body + '</div><div>' + filesHtml + '</div></div></li>';
    }

    ul.innerHTML = html;

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
