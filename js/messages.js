var MS =
{
  contact: null,
  _upl: []
};

MS.add = function (data, pos)
{
  var html = '',
    subj,
    tags = [],
    subjects = [],
    page = document.getElementById('page-msgs'),
    cmp = document.getElementById('composer'),
    ul = page.querySelector('ul');

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

  if (pos == 'top') ul.innerHTML = html + ul.innerHTML;
  else ul.innerHTML += html;

  // caption for a composer topic suggester
  cmp.querySelector('.cap').innerText = subj || 'New topic';

  // fill in subjects
  html = '';
  subjects = ML.uniques(subjects, true);
  for (i in subjects)
  {
    html += '<li>' + subjects[i] + '</li>';
  }

  html = html || '<li>New topic</li>';
  
  document.querySelector('#snackbar-menu-tags ul').innerHTML += html;
  cmp.querySelector('.subjects').innerHTML += html;

  // connect subject picker
  Array.prototype.forEach.call(cmp.querySelectorAll('.subjects li'), function (el)
  {
    el.classList.add('ndf');
    el.onclick = function ()
    {
      cmp.querySelector('.cap').innerText = this.innerText;
      cmp.querySelector('textarea').focus();
      cmp.querySelector('.subjects').classList.remove('opened');
    }
  });


  /*Array.prototype.forEach.call(page.querySelectorAll('li a'), function (el)
   {
   el.onclick = function ()
   {
   ML.api('file', 'getFileUrl', {extId: el.dataset.id}, function (url)
   {
   window.location = url;
   });
   return false;
   };
   });*/


  // scrolling hack
  setTimeout(function (ul)
  {
    ul.scrollIntoView(false);
  }, 100, ul);
};

MS.show = function (email, id)
{
  var page = document.getElementById('page-msgs'),
      ul = page.querySelector('ul');

  ML.hidePages();
  ul.innerHTML = '<li>Loading...</li>';
  document.querySelector('#snackbar .name').innerHTML = '';
  document.getElementById('snackbar').style.display = 'block';
  page.style.display = 'block';

  ML.load('modules/emojis');

  ML.api('message', 'findByReference', {email: email, id: id}, function (data)
  {
    MS.contact = data.contact;
    MS.contact.email = email;

    var name = MS.contact.name;
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
    document.querySelector('#snackbar-menu-more .mute').innerText = MS.contact.muted ? 'Unmute' : 'Mute';

    MS.add(data.messages, 'bottom');

    ML.loadFiles(email)
  });

  ML.loadFiles = function (email)
  {
    var fileList = document.querySelector('#snackbar-menu-files ul');
    fileList.innerHTML = 'Loading ...';

    ML.api('file', 'findByEmail', {email: email, withImageUrl: false /*true*/}, function (files)
    {
      files = [1,2,3,4,5,6,7];
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
