var MS =
{
  contact: null,
  _upl: [],
  subjects: []
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
    if (!data[i].from.id) data[i].from = AU.user;

    var filesHtml = 0,
      body = data[i].body,
      whose = data[i].from.email == AU.user.email ? 'yours' : 'mine',
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
      filesHtml = '';
      
      for (var fi in data[i].files)
      {
        var file = data[i].files[fi];

        if (file.type.match('image.*'))
        {
          if (file.data)
          {
            filesHtml += '<div class="file-icon ' + (data[i].files.length == 1 ? ' full' : '') + '" id="img-file-'
              + file.extId
              + '" data-id="'
              + file.extId
              + '" data-url="'
              + file.data
              + '" data-mime="'
              + file.type
              + '" style="background:url(' + file.data + ')"></div>';
            continue;
          }

          (function (f)
          {
            ML.api('file', 'getFileUrl', {extId:file.extId}, function (url)
            {
              var image = document.getElementById('img-file-' + f.extId);
              image.innerHTML = '';
              image.dataset.url = url;
              image.dataset.mime = f.type;
              image.style.backgroundImage = 'url(' + url + ')';
            })
          })(file);
        }

        filesHtml += '<div class="file-icon" id="img-file-'
          + file.extId + '" data-id="' + file.extId
          + '" style="background:' + ML.colorHash(file.type)
          + '">' + file.type.split('/')[1] + '</div>';
      }
    }

    subj = data[i].subject;

    if (!subj.length) subj = '—';

    var nc = sName.split(' ');

    nc = nc.length == 1 ? nc[0].charAt(0) : (nc[0].charAt(0) + nc[1].charAt(0));

    html +=
      '<li data-id="' + data[i].id + '" class="' + whose + '">' +
      '<div>' +
      '<div class="white">' +
      '<div class="cap">' + subj + '</div>' +
      '<div class="msg">' + body + '</div>' +
      (filesHtml ? '<div class="files">' + filesHtml + '</div>': '') +
      '</div>' +
      '<div class="foot"><div class="ava" style="background:' + ML.colorHash(data[i].from.email) + '">' + nc + '</div><div class="ts">' + ML.ts(data[i].ts) + '</div></div>' +
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
    // check if subject was already added before
    if (MS.subjects.indexOf(subjects[i]) != -1)
    {
      continue;
    }

    MS.subjects.push(subjects[i]);

    html += '<li>' + subjects[i] + '</li>';
  }

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

    // reset subject lists
    MS.subjects = [];
    document.querySelector('#snackbar-menu-tags ul').innerHTML = '';
    page.querySelector('.subjects').innerHTML = '';

    ul.innerHTML = '';
    MS.add(data.messages, 'top');

    ML.loadFiles(email)
  });

  ML.loadFiles = function (email)
  {
    var fileList = document.querySelector('#snackbar-menu-files ul');
    fileList.innerHTML = 'Loading ...';

    ML.api('file', 'findByEmail', {email: email, withImageUrl: true}, function (files)
    {
      var url, html = '', im, div;

      for (var i in files)
      {
        if (files[i].type.match('image.*'))
        {
          url = files[i].url;
          
          // preload
          im = new Image();
          im.src = url;
          
          div = '<div class="img" data-url="' + url + '" data-mime="' + files[i].type + '" style="background-image:url(' + url + ')"></div>'
        }
        else
        {
          div = '<div class="img" style="background:' + ML.colorHash(files[i].type) + '">' + files[i].type.split('/')[1] + '</div>'
        }

        html += '<li>' + div + '<div class="bar"><div></div><div></div></div></li>'
      }

      fileList.innerHTML = html.length ? html : 'No files in this chat';
    })
  }
};

// === INIT ===

(function ()
{
  document.querySelector('#page-msgs ul').onclick = function (e)
  {
    if (!e.target.classList.contains('file-icon')) return;

    ML.demo(e.target.dataset.url, e.target.dataset.mime)
  };
})();
