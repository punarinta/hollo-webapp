var MS =
{
};

MS.add = function (data, pos)
{
  var html = '';

  if (pos == 'top') document.querySelector('#page-msgs ul').innerHTML = html + document.querySelector('#page-msgs ul').innerHTML;
  else document.querySelector('#page-msgs ul').innerHTML += html;
};

MS.show = function (email, id)
{
  var ul = document.querySelector('#page-msgs ul');
  ML.hidePages();
  ul.innerHTML = '<li>Loading...</li>';
  document.querySelector('#snackbar .name').innerHTML = '';
  document.getElementById('snackbar').style.display = 'block';
  document.getElementById('page-msgs').style.display = 'block';

  ML.load('modules/emojis');

  ML.api('message', 'findByReference', {email: email, id: id}, function (data)
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

      var nc = sName.split(' '),
        ncc = parseInt(md5(data[i].from.email).substr(0, 6), 16),
        b = ncc & 0xFF, g = (ncc >> 8) & 0xFF, r = ncc >> 16;

      nc = nc.length == 1 ? nc[0].charAt(0) : (nc[0].charAt(0) + nc[1].charAt(0));
      ncc = [(r >> 1) + 96, (g >> 1) + 96, (b >> 1) + 96].join(',');

      html +=
        '<li data-id="' + data[i].id + '" class="' + whose + '">' +
        '<div>' +
        '<div class="white">' +
        '<div class="cap">' + subj + '</div>' +
        '<div class="msg">' + body + '</div>' +
        '</div>' +
        '<div class="foot"><div class="ava" style="background:rgb(' + ncc + ')">' + nc + '</div><div class="ts">' + ML.ts(data[i].ts) + '</div></div>' +
        '</div>' +
        '</li>';
    }

    ul.innerHTML = html;

    document.querySelector('#composer .cap').innerText = subj || 'New topic';

    Array.prototype.forEach.call(document.querySelectorAll('#page-msgs li a'), function (el)
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

    Array.prototype.forEach.call(document.querySelectorAll('#page-msgs li .cap'), function (el)
    {
      el.onclick = function ()
      {
        console.log('TODO: filter on click');
        /*var event = document.createEvent('HTMLEvents'),
         filter = document.querySelector('#page-msgs .filter');

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
    html = html || '<li>New topic</li>';
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

        html += '<li><div class="img" style="background-image:url('+ url + ')"></div>'
             + '<div class="bar"><div></div><div></div>'
             + '</div></li>';
      }
      document.querySelector('#snackbar-menu-files ul').innerHTML = html;
    })
  }
};
