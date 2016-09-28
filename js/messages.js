var MS =
{
  chat: null,
  _upl: [],
  subjects: [],
  loaded: 0,
  page: document.getElementById('page-msgs')
};

MS.clearBody = function (body)
{
  // preprocess body
  var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

  if (CFG._('newlines'))
  {
    body = body.replace(/(?:\r\n|\r|\n)/g, '<br />');
  }
  else
  {
    body = body.replace(/(?:\r\n\r\n)/g, '</p><p>');
  }

  body = body.replace(exp, function (m)
  {
    return '<a target="_blank" rel="noopener noreferrer" href="' + m + '">' + (m.length > 40 ? m.substr(0, 40) + '&hellip;' : m) + '</a>';
  });

  body = body.replace(/ -- /g, ' — ');

  return '<p>' + body + '</p>';
};

MS.add = function (data, pos, status)
{
  var subj, i,
      html = '',
      tags = [],
      subjects = [],
      cmp = document.getElementById('composer'),
      ul = MS.page.querySelector('ul');

  for (i in data)
  {
    if (!data[i].from.id) data[i].from = AU.user;

    var filesHtml = 0,
        body = MS.clearBody(data[i].body || ''),
        mine = data[i].from.email == AU.user.email,
        whose = mine ? 'mine' : 'yours',
        sName = data[i].from.name ? data[i].from.name : data[i].from.email;

    tags = tags.concat(data[i].subject.split(' '));
    subjects.push(data[i].subject);

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

          if (file.extId)
          {
            (function (f)
            {
              ML.api('file', 'getFileUrl', {extId:file.extId}, function (url)
              {
                var image = document.getElementById('img-file-' + f.extId);
                if (image)
                {
                  image.innerHTML = '';
                  image.dataset.url = url;
                  image.dataset.mime = f.type;
                  image.style.backgroundImage = 'url(' + url + ')';
                }
              })
            })(file);
          }
        }

        filesHtml += '<div class="file-icon" id="img-file-'
          + file.extId + '" data-id="' + file.extId
          + '" data-mime="' + file.type + '" style="background:' + ML.colorHash(file.type)
          + '">' + file.type.split('/')[1].substring(0, 8) + '</div>';
      }
    }
    else
    {
      if (!body) body = '[HTML content]';
    }

    body = body.replace(/\[sys:fwd\]/g, '<div class="fwd">Forwarded message</div>');

    subj = data[i].subject;

    if (!subj.length) subj = '—';

    var nc = sName.split(' '),
        ava = ML.colorHash(data[i].from.email);

    nc = nc.length == 1 ? nc[0].charAt(0) : (nc[0].charAt(0) + nc[1].charAt(0));

    if (mine && AU.user.ava)
    {
      ava = '#fff url(\'' + AU.user.ava + '\')';
      nc = '';
    }

    html += '<li data-id="' + data[i].id + '" class="' + whose + '"><div><div class="white"><div class="cap">'
      + subj + '</div>'
      + (body ? ('<div class="msg">' + body + '</div>') : '')
      + (filesHtml ? '<div class="files">' + filesHtml + '</div>': '')
      + '</div><div class="foot"><div class="ava' + (mine ? ' full' : '') + '" style="background:' + ava + '">' + nc
      + '</div><div class="info"><span class="status ' + (status || 's2') + '"></span><span class="ts">'
      + ML.ts(data[i].ts) + '</span><span class="name hidden">' + sName
      + '</span></div></div></div></li>';
  }

  if (data.length == 1)
  {
    ul.classList.add('stand-still')
  }

  if (pos == 'top') ul.innerHTML = html + ul.innerHTML;
  else ul.innerHTML += html;

  // caption for a composer topic suggester
  cmp.querySelector('.cap').value = subj || 'New topic';

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

    // filter topics
    html += '<li>' + subjects[i] + '</li>';
  }

  var menuTags = document.querySelector('#snackbar-menu-tags ul');

  // reset placeholder
  if (menuTags.innerHTML.indexOf('<div>') != -1 && data.length) menuTags.innerHTML = '';

  menuTags.innerHTML += html;

  // connect subject picker
  var lis = cmp.querySelectorAll('.subjects li');

  Array.prototype.forEach.call(lis, function (el)
  {
    el.classList.add('ndf');
    el.onclick = function ()
    {
      var newSubj = this.innerText;
      Array.prototype.forEach.call(lis, function (el)
      {
        el.classList.remove('hidden');
        if (el.innerText == newSubj)
        {
          el.classList.add('hidden')
        }
      });
      cmp.querySelector('.cap').value = newSubj;
      cmp.querySelector('textarea').focus();
      cmp.querySelector('.subjects').classList.remove('opened');
    }
  });

  if (pos != 'top')
  {
    // scrolling hack
    setTimeout(function (ul)
    {
      // ul.scrollIntoView(false);
      var r = document.body.getBoundingClientRect(), h = r.bottom - r.top;
      ul.scrollTop = document.body.scrollTop = h;
    }, 100, ul);
  }

  return ul.querySelector('li:last-child')
};

MS.show = function (id)
{
  var ul = MS.page.querySelector('ul'),
      snackbar = document.getElementById('snackbar');

  // save contacts list offset
  CO.yPos = window.pageYOffset || CO.page.querySelector('ul').scrollTop;

  if (!CO.loaded && ML.state.widthMode)
  {
    CO.show(8);
  }
  
  // 'shown'
  MS.loaded = 1;

  ML.hidePages();
  ul.innerHTML = '';
  snackbar.querySelector('.roster').innerHTML = '';
  Array.prototype.forEach.call(snackbar.querySelectorAll('.sub'), function (el)
  {
    el.classList.remove('toggled')
  });

  snackbar.style.display = 'flex';

  MS.page.style.display = 'inline-block';

  if (MS.chat && id != MS.chat.id)
  {
    // clear all the shit from composer
    MS._upl = [];
    MS.page.querySelector('textarea').value = '';
    document.getElementById('uploaded').innerHTML = '';
    MS.cmpResize();
  }

  ML.load('modules/emojis');

  // reset filter
  MS.filter(0);

  ML.api('message', 'findByChatId', {chatId: id}, function (data)
  {
    MS.chat = data.chat;

    var xname = CO.xname(MS.chat);
    snackbar.querySelector('.roster').innerHTML = xname[0];
    document.querySelector('#snackbar-menu-more .mute').innerText = MS.chat.muted ? 'Unmute' : 'Mute';

    // reset subject lists
    MS.subjects = [];
    document.querySelector('#snackbar-menu-tags ul').innerHTML = '<div>Here we will list the subjects used in this conversation</div>';

    ul.innerHTML = '';
    MS.add(data.messages, 'bottom');

    if (MS.chat.users.length > 1)
    {
      ML.loadFiles(MS.chat.id)
    }
    else
    {
      // load directly by email
      ML.loadFiles(MS.chat.users[0].email, 1)
    }

    // mark chat as 'read' in the chat list
    var chatItem = CO.page.querySelector('li[data-id="' + id + '"] .img');
    if (chatItem)
    {
      chatItem.classList.remove('unread');
    }

    // init chat roster
    CR.init(MS.chat.users)
  });

  /**
   * Load files by email
   *
   * @param index
   * @param mode    - 0 -- by chat ID, 1 -- by email
   */
  ML.loadFiles = function (index, mode)
  {
    mode = mode || 0;

    var fileList = document.querySelector('#snackbar-menu-files ul'),
        params = mode ? {email: index} : {chatId: index};

    fileList.innerHTML = 'Loading ...';
    params.withImageUrl = true;

    ML.api('file', mode ? 'findByEmail' : 'findByChatId', params, function (files)
    {
      var i, url, im, div, html = '';

      for (i in files)
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

      fileList.innerHTML = html.length ? html : '<div>No files in this chat</div>';
    })
  }
};

MS.filter = function (subj)
{
  var snackTags = document.getElementById('snackbar-menu-tags'),
      filter = document.getElementById('msgs-filter'),
      snackbar = document.getElementById('snackbar'),
      ul = MS.page.querySelector('ul');
  
  if (subj)
  {
    Array.prototype.forEach.call(ul.querySelectorAll('li'), function (li)
    {
      li.style.display = li.querySelector('.cap').innerText == subj ? 'list-item' : 'none';
    });

    filter.style.display = 'flex';
    filter.querySelector('.body').innerText = subj;
    snackbar.querySelector('.icon.tags').classList.remove('toggled');
    snackTags.style.display = 'none';
    MS.page.classList.add('filtered');
    document.getElementById('msgs-more').style.display = 'none';
  }
  else
  {
    Array.prototype.forEach.call(ul.querySelectorAll('li'), function (li)
    {
      li.style.display = 'list-item';
    });

    filter.style.display = 'none';
    MS.page.classList.remove('filtered');
    document.getElementById('msgs-more').style.display = 'block';

    setTimeout(function (ul)
    {
      ul.scrollIntoView(false);
    }, 100, ul);
  }
};


// === INIT ===

MS.page.querySelector('ul').onclick = function (e)
{
  if (e.target.classList.contains('file-icon'))
  {
    ML.demo(e.target.dataset.url, e.target.dataset.mime)
  }

  if (e.target.tagName == 'A' && window.self !== window.top)  // if a link is clicked on mobile app
  {
    parent.postMessage({cmd: 'openUrl', url: e.target.getAttribute('href', 2), external: true}, '*');
    return false;
  }

  if (e.target.classList.contains('fwd'))
  {
    var li = PP.par(e.target, 'li');

    busy(1);

    // replace message contents with original mail body
    ML.api('message', 'showOriginal', {id: li.dataset.id}, function (data)
    {
      li.querySelector('.fwd').outerHTML = MS.clearBody(data);
      busy(0);
    });
  }

  if (e.target.classList.contains('ava'))
  {
    var parent = e.target.parentElement;
    parent.querySelector('.ts').classList.toggle('hidden');
    parent.querySelector('.name').classList.toggle('hidden');
  }
};

document.getElementById('msgs-more').onclick = function ()
{
  busy(1);

  // can be called only by ID
  ML.api('message', 'moreByChatId', {chatId: MS.chat.id}, function (data)
  {
    console.log('More messages requested:', data);
    MS.add(data, 'top');
    busy(0);
  });
};

