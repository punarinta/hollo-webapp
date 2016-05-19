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
      whose = data[i].from.email == AU.user.email ? 'mine' : 'yours',
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

        if (file.type.indexOf('image/') != -1)
        {
          if (file.data)
          {
            filesHtml += '<div id="img-file-' + file.extId + '" data-id="' + file.extId + '" style="background:url(' + file.data + ')"></div>';
            continue;
          }

          (function (f)
          {
            ML.api('file', 'getFileUrl', {extId:file.extId}, function (url)
            {
              var image = document.getElementById('img-file-' + f.extId);
              image.innerHTML = '';
              image.style.backgroundImage = 'url(' + url + ')';
            })
          })(file);
        }

        filesHtml += '<div id="img-file-' + file.extId + '" data-id="' + file.extId + '" style="background:' + ML.colorHash(file.type) + '">' + file.type.split('/')[1] + '</div>';
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
      (filesHtml ? '<div class="files">' + filesHtml + '</div>': '') +
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
        if (files[i].type.indexOf('image/') != -1)
        {
          url = files[i].url;
          
          // preload
          im = new Image();
          im.src = url;
          
          div = '<div class="img" style="background-image:url('+ url + ')"></div>'
        }
        else
        {
          div = '<div class="img" style="background:' + ML.colorHash(files[i].type) + '">' + files[i].type.split('/')[1] + '</div>'
        }

        html += '<li>' + div + '<div class="bar"><div></div><div></div></div></li>'
      }

      fileList.innerHTML = html;
    })
  }
};

// === INIT ===

(function ()
{
  var cmp = document.getElementById('composer'),
      cmpText = cmp.querySelector('textarea');

  cmpText.onclick = function ()
  {
    cmp.classList.add('focused');
  };

  cmpText.onkeyup = function (e)
  {
    // left trim the contents
    this.value = this.value.replace(/^\s+/, '');

    if (/[^a-zA-Z0-9-_]/.test(this.value.slice(-1)) && e.keyCode > 31)
    {
      var that = this, w = this.value.trim().split(' ').slice(-1)[0].toLowerCase().replace(/[_\W]+/g, '');
      if (typeof EMJ[w] != 'undefined')
      {
        var em = document.createElement('div');
        em.innerText = EMJ[w];
        em.dataset.w = w;
        setTimeout(function(o)
        {
          if (o.parentNode) o.parentNode.removeChild(o);
        }, 5000, em);
        em.onclick = function ()
        {
          // replace the last occurrence of a word with an emoji
          var pat = new RegExp('(\\b' + this.dataset.w + '\\b)(?!.*\\b\\1\\b)', 'i');
          that.value = that.value.replace(pat, this.innerText);
          em.parentNode.removeChild(em);
          that.focus();
        };
        document.querySelector('#page-msgs .emojis').appendChild(em);
      }
    }
  };

  autosize(cmpText);

  cmpText.addEventListener('autosize:resized', function (e)
  {
    var h = parseInt(e.target.style.height, 10), f = MS._upl.length ? 78 : 0;

    cmp.style.height = (h + 21) + 'px';
    cmp.querySelector('.emojis').style.bottom = f + (h + 53) + 'px';
    cmp.querySelector('.head').style.bottom = f + (h + 21) + 'px';
    cmp.querySelector('.send').style.bottom = (f + h)/2 + 'px';
    cmp.querySelector('.subjects').style.bottom = f + (h + 54) + 'px';
    cmpText.style.bottom = f + 'px';
  });

  Array.prototype.forEach.call(cmp.querySelectorAll('*'), function(el)
  {
    el.classList.add('ndf');
  });

  document.onclick = function (e)
  {
    // 'ndf' for 'no defocus'
    if (e.target.classList.contains('ndf')) return;
    cmp.classList.remove('focused');
  };

  cmp.querySelector('.send').onclick = function ()
  {
    // send a message
    var msg = cmpText.value, subj = cmp.querySelector('.cap').innerText, msgId = null;

    if (!msg.length)
    {
      ML.mbox('You didn\'t input any message');
      return;
    }

    // try to find last message id
    var lis = document.querySelectorAll('#page-msgs > ul li:last-child');
    if (lis.length)
    {
      msgId = lis[0].dataset.id;
    }

    console.log('body:', msg);
    console.log('subject:', subj);
    console.log('messageId:', msgId);

    // push data to the bottom
    var m =
    {
      body: msg,
      subject: subj,
      from: AU.user,
      ts: new Date().getTime() / 1000,
      id: 0, // ?,
      files: []
    };

    if (MS._upl.length)
    {
      for (var i in MS._upl)
      {
        m.files.push(
        {
          name: '—',
          type: 'image/png',
          size: 0,
          extId: 'foobar',
          data: MS._upl[i]
        });
        // console.log('File attached: ' + MS._upl[i]);
      }
    }

    MS.add([m], 'bottom');

    ML.api('message', 'send', {body: msg, messageId:msgId, subject: subj}, function (json)
    {
      console.log('result:', json);

      // reset composer
      MS._upl = [];
      cmpText.value = '';
      document.getElementById('uploaded').innerHTML = '';
      cmpText.dispatchEvent(new Event('autosize:update'));
      cmpText.dispatchEvent(new Event('autosize:resized'));
    });
  };

  cmp.querySelector('.picker').onclick = function ()
  {
    cmp.querySelector('.subjects').classList.toggle('opened');
    cmpText.focus();
  };

  cmp.querySelector('#upload').onchange = function (e)
  {
    var files = e.target.files;

    for (var i = 0, f; f = files[i]; i++)
    {
      // Only process image files.
      if (!f.type.match('image.*'))
      {
        continue;
      }
      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function (f)
      {
        return function (e)
        {
          // Render thumbnail.
          var span = document.createElement('span');
          span.innerHTML = '<img src="' + e.target.result + '" title="' + encodeURI(f.name) + '"/>';

          document.getElementById('uploaded').insertBefore(span, null);

          console.log('File read:', f, e);
          MS._upl.push(e.target.result);
          cmpText.dispatchEvent(new Event('autosize:update'));
          cmpText.dispatchEvent(new Event('autosize:resized'));
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
  };
})();
