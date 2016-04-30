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
  document.getElementById('snackbar').style.display = 'none';
};

ML.showLogin = function ()
{
  ML.hidePages();
  document.getElementById('page-login').style.display = 'block';
};

ML.showContacts = function ()
{
  var ul = document.querySelector('#page-contacts ul');
  ML.hidePages();
  ul.innerHTML ='<li>Loading...</li>';
  document.getElementById('page-contacts').style.display = 'block';

  ML.api('contact', 'find', null, function (data)
  {
    var html = '', name;

    for (var i in data)
    {
      name = data[i].name ? data[i].name : data[i].email;
      html += '<li data-email="' + data[i].email + '"><div class="name">' + name + ' (' + data[i].count + ' &#9993;)</div><div>' + data[i].email + '</div></li>';
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
  ul.innerHTML = '<li>Loading...</li>';
  document.querySelector('#snackbar .name').innerHTML = '';
  document.getElementById('snackbar').style.display = 'block';
  document.getElementById('page-chat').style.display = 'block';

  ML.api('message', 'findByEmail', {email: email}, function (data)
  {
    var html = '';
    var tags = [], subjects = [];

    document.querySelector('#snackbar .name').innerHTML = data.contact.name ? data.contact.name : email;

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


    // fill in tags
    
    html = '<div class="new tag">+</div>';
    tags = ML.uniques(tags, false);
    for (var i in tags)
    {
      if (!tags[i].replace(/[^a-z]/gmi, '').length) continue;
      html += '<div class="tag">' + tags[i] + '</div>';
    }
    document.querySelector('#composer .tags').innerHTML = html;

    Array.prototype.forEach.call(document.querySelectorAll('#composer .tag'), function(el)
    {
      el.onclick = function ()
      {
        Array.prototype.forEach.call(document.querySelectorAll('#composer .tag'), function (el) { el.classList.remove('sel'); });
        this.classList.add('sel');

        if (this.classList.contains('new'))
        {
          var tag = prompt('New tag:', 'hollotag'),
              clone = document.querySelector('#composer .tag').cloneNode(false);
          clone.innerText = '#' + tag;
          document.querySelector('#composer .tags').appendChild(clone);
        }
      };
    });

    // fill files in background
    var files = [1,2,3,4,5,6,7];
    html = '';
    for (var i in files)
    {
      html += '<li><div class="img"></div>'
          + '<div class="bar"><div></div><div></div><div></div>'
          +'</div></li>';
    }
    document.querySelector('#snackbar-menu-files ul').innerHTML = html;
    Array.prototype.forEach.call(document.querySelectorAll('#snackbar-menu-files li .img'), function(el)
    {
      el.style.backgroundImage = "url('https://ssl.webpack.de/lorempixel.com/300/300/?" + Math.random() + "')";
    });
  });
};
