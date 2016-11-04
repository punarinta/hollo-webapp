var MS =
{
  chat: null,
  _upl: [],
  subjects: [],
  offset: 0,
  more: 0,
  loaded: 0,
  pageLength: 10,
  page: document.getElementById('page-msgs'),

  clearBody (body = '')
  {
    body = body.replace(/(?:[ ]\r\n|[ ]\r|[ ]\n)/g, ' ');

    if (CFG._('newlines')) body = body.replace(/(?:\r\n|\r|\n)/g, '<br />');
    else body = body.replace(/(?:\r\n\r\n)/g, '</p><p>');

    // URLs
    body = body.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, m =>
    {
      return `<a target="_blank" rel="noopener noreferrer" href="${m}">${m.length > 40 ? m.substr(0, 40) + '&hellip;' : m}</a>`;
    });

    // mailto: links
    body = body.replace(/(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim, '<a target="_blank" rel="noopener noreferrer" href="mailto:$1">$1</a>');

    body = body.replace('/mailto:/g', '');
    body = body.replace(/ -- /g, ' — ');

    return `<p>${body}</p>`;
  },

  add (data, status)
  {
    var i, html = '',
        subjects = [],
        cmp = document.getElementById('composer'),
        ul = this.page.querySelector('ul');

    for (let i = data.length - 1; i >= 0; i--)
    {
      if (!data[i].from.id) data[i].from = AU.user;

      var filesHtml = 0,
          body = data[i].body,
          mine = data[i].from.email == AU.user.email,
          whose = mine ? 'mine' : 'yours',
          [name, nc] = CO.xname({users:[data[i].from]}),
          subj = data[i].subject,
          email = data[i].from.email;

      if (ML.isJson(body) && body && body.charAt(0) == '{')
      {
        var w = JSON.parse(body).widget,
            org = w.org[1] || w.org[0],
            when = ML.ts(w.from) + ' – ' + ML.ts(w.to, 2),
            url = w.descr.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig),
            atts = [];

        for (let j = 0; j < w.att.length; j++)
        {
          if (atts.length == 3)
          {
            atts.push('...');
            break;
          }
          let toAdd = w.att[j][1].length ? w.att[j][1] : w.att[j][0];
          if (toAdd != org) atts.push(toAdd)
        }

        // for now we only support calendars
        subj = w.title;
        body =
          `<div class="widget event">
            <div class="b when">
              <icon></icon>
              <div>
                <div>When</div>
                <div>${when}</div>
              </div>
            </div>
            ${w.where ? (`<div class="b where"><icon></icon><div><div>Where</div><div>${w.where}</div></div></div>`):''}
            <div class="people">
              <div class="b org">
                <icon></icon>
                <div>
                  <div>Organizer</div>
                  <div>${org}</div>
                </div>
              </div>
              <div class="b att">
                <icon></icon>
                <div>
                  <div>Invitees</div>
                  <div>${atts.join(`<br>`)}</div>
                </div>
              </div>
            </div>${url ? (`<div class="open"><a target="_blank" href="${url}">Open in calendar</a></div>`) : ''}
          </div>`
      }
      else
      {
        body = this.clearBody(body)
      }

      if (subj.length)
      {
        subjects.push(data[i].subject);
      }

      if (data[i].files)
      {
        let offset = 0;
        filesHtml = '';

        for (let fi = 0; fi < data[i].files.length; fi++)
        {
          let file = data[i].files[fi];

          if (file.type.match('image.*'))
          {
            if (file.data)
            {
              filesHtml += `<div class="file-icon ${data[i].files.length == 1 ? 'full' : ''}"
                data-url="${file.data}"
                data-mime="${file.type}"
                style="background:url(${file.data})"></div>`;
              continue;
            }
          }

          filesHtml +=
            `<div class="file-icon" data-msgid="${data[i].id}" data-offset="${offset}" data-mime="${file.type}" style="background:${ML.colorHash(file.type)}">
              ${file.type.split('/')[1].substring(0, 8)}
            </div>`;

          ++offset;
        }
      }
      else
      {
        if (!body) body = '[HTML content]';
      }

      body = body.replace(/\[sys:fwd\]/g, '<div class="fwd">Forwarded message</div>');

      var ava = `${ML.colorHash(email)} url('/files/avatars/${email}')`;

      if (mine && AU.user.ava)
      {
        ava = `#fff url(${AU.user.ava})`;
        nc = '';
      }

      // if Google avatar is loaded, clear inner text
      (function (id, email)
      {
        var im = new Image;
        im.onload = function ()
        {
          var s = MS.page.querySelector(`li[data-id="${id}"] .ava`);
          if (s) s.innerHTML = '';
        };
        im.src = '/files/avatars/' + email;
      })(data[i].id, email);

      html +=
        `<li data-id="${data[i].id}" class="${whose}">
          <div>
          <div class="white">
            <div class="cap">${subj}</div>
              ${(body ? (`<div class="msg">${body}</div>`) : '')}
              ${(filesHtml ? `<div class="files">${filesHtml}</div>`: '')}
            </div>
            <div class="foot">
              <div class="ava ${mine ? 'full' : ''}" style="background:${ava}">${nc}</div>
              <div class="info">
                <span class="status ${status || 's2'}"></span>
                <span class="ts">${ML.ts(data[i].ts)}</span>
                <span class="name hidden">${name}</span>
              </div>
            </div>
          </div>
        </li>`;
    }

    if (data.length == 1)
    {
      ul.classList.add('stand-still')
    }

    // caption for a composer topic suggester
    cmp.querySelector('.cap').value = subj || 'New topic';

    // fill in subjects
    let subjectsHtml = '';
    subjects = ML.uniques(subjects, true);

    for (i in subjects)
    {
      // check if subject was already added before
      if (this.subjects.indexOf(subjects[i]) != -1)
      {
        continue;
      }

      this.subjects.push(subjects[i]);

      // filter topics
      subjectsHtml += `<li>${subjects[i]}</li>`;
    }

    var menuTags = document.querySelector('#snackbar-menu-tags ul');

    // reset placeholder
    if (menuTags.innerHTML.indexOf('<div>') != -1 && data.length) menuTags.innerHTML = '';

    menuTags.innerHTML += subjectsHtml;

    // connect subject picker
    var lis = cmp.querySelectorAll('.subjects li');

    Array.prototype.forEach.call(lis, el =>
    {
      el.classList.add('ndf');
      el.onclick = function ()
      {
        var newSubj = this.innerText;
        Array.prototype.forEach.call(lis, el =>
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

    return html;
  },

  scrollBottom (offset = 0)
  {
    setTimeout( () =>
    {
      let r = document.body.getBoundingClientRect(),
          h = r.bottom - r.top - (offset ? (screen.height + offset) : 0);
      MS.ul.scrollTop = document.body.scrollTop = h;
    }, 100);
  },

  show (id)
  {
    var snackbar = document.getElementById('snackbar');

    // save contacts list offset
    CO.yPos = window.pageYOffset || CO.page.querySelector('ul').scrollTop;

    if (!CO.loaded && ML.state.widthMode)
    {
      CO.show(8);
    }

    // 'shown'
    MS.loaded = 1;

    ML.hidePages();
    MS.ul.innerHTML = '';
    snackbar.querySelector('.roster').innerHTML = '';
    Array.prototype.forEach.call(snackbar.querySelectorAll('.sub'), el =>
    {
      el.classList.remove('toggled')
    });

    snackbar.style.display = 'flex';

    MS.page.style.display = 'inline-block';

    if (this.chat && id != this.chat.id)
    {
      // clear all the shit from composer
      MS._upl = [];
      MS.page.querySelector('textarea').value = '';
      document.getElementById('uploaded').innerHTML = '';
      this.cmpResize();
    }

    ML.load('modules/emojis');

    // reset filter
    this.filter(0);

    ML.api('message', 'findByChatId', {chatId: id, pageStart: MS.offset, pageLength: MS.pageLength}, data =>
    {
      MS.chat = data.chat;

      let xname = CO.xname(MS.chat);
      snackbar.querySelector('.roster').innerHTML = xname[0];
      document.querySelector('#snackbar-menu-more .mute').innerText = MS.chat.muted ? 'Unmute' : 'Mute';

      // reset subject lists
      MS.subjects = [];
      document.querySelector('#snackbar-menu-tags ul').innerHTML = '<div>Here we will list the subjects used in this conversation</div>';

      if (data.messages.length)
      {
        MS.ul.innerHTML = MS.add(data.messages);
        MS.page.classList.remove('empty');
      }
      else
      {
        MS.ul.innerHTML = '<div>No messages?<br><br>We only keep those<br>from last 6 months.</div>';
        MS.page.classList.add('empty');
      }

      MS.scrollBottom();

      if (data.messages.length == MS.pageLength)
      {
        MS.more = 1;
      }

      MS.loadFiles(MS.chat.id);

      // mark chat as 'read' in the chat list
      var chatItem = CO.page.querySelector(`li[data-id="${id}"] .img`);

      if (chatItem)
      {
        chatItem.classList.remove('unread');
      }

      // init chat roster
      CR.init(MS.chat.users)
    });
  },

  /**
   * Load files by email
   *
   * @param index
   */
  loadFiles (index)
  {
    var fileList = document.querySelector('#snackbar-menu-files ul');

    fileList.innerHTML = 'Loading ...';

    ML.api('file', 'findByChatId', {chatId: index, withImageUrl: true}, files =>
    {
      var i, url, im, internal, html = '', offset = 0;

      for (i in files)
      {
        url = files[i].url;

        /*  if (files[i].type.match('image.*') && url)
         {
         // preload
         im = new Image();
         im.src = url;

         internal = 'data-url="' + url + '" style="background-image:url(' + url + ')">'

         // connect to message images if necessary
         var image = document.getElementById('img-file-' + files[i].extId);
         if (image)
         {
         image.innerHTML = '';
         image.dataset.url = url;
         image.dataset.mime = files[i].type;
         image.style.backgroundImage = 'url(' + url + ')';
         }
         }
         else
         {*/
        internal = `style="background:${ML.colorHash(files[i].type)}">` + files[i].type.split('/')[1];
        //  }

        html += `<li data-mime="${files[i].type}" data-msgid="${files[i].msgId}" data-offset="${offset}"><div class="img" ${internal}</div><div class="bar"><div class="download"></div></div></li>`;

        ++offset
      }

      fileList.innerHTML = html.length ? html : '<div>No files in this chat</div>';
    })
  },

  filter (subj)
  {
    var snackTags = document.getElementById('snackbar-menu-tags'),
        filter = document.getElementById('msgs-filter'),
        snackbar = document.getElementById('snackbar');

    mixpanel.track('Message - filter', {subject: subj});

    if (subj)
    {
      Array.prototype.forEach.call(MS.ul.querySelectorAll('li'), li =>
      {
        li.style.display = li.querySelector('.cap').innerText == subj ? 'list-item' : 'none';
      });

      filter.style.display = 'flex';
      filter.querySelector('.body').innerText = subj;
      snackbar.querySelector('.icon.tags').classList.remove('toggled');
      snackTags.style.display = 'none';
      this.page.classList.add('filtered');
      document.getElementById('msgs-more').style.display = 'none';
    }
    else
    {
      Array.prototype.forEach.call(MS.ul.querySelectorAll('li'), li =>
      {
       li.style.display = 'list-item';
      });

      filter.style.display = 'none';
      this.page.classList.remove('filtered');
      document.getElementById('msgs-more').style.display = 'block';

      setTimeout( () =>
      {
        MS.ul.scrollIntoView(false);
      }, 100);
    }
  },

  cmpResize ()
  {
    var cmpText = document.querySelector('#composer textarea');
    cmpText.dispatchEvent(new Event('autosize:update'));
    cmpText.dispatchEvent(new Event('autosize:resized'));
  },

  send ()
  {
    var u, i, cmp = document.getElementById('composer'),
        cmpText = cmp.querySelector('textarea'), msgId = null,
        msg = cmpText.value, subj = cmp.querySelector('.cap').value;

    if (!msg.length && !this._upl.length)
    {
      ML.mbox('Nothing to send');
      return;
    }

    // try to find last message with real id
    Array.prototype.forEach.call(MS.ul.querySelectorAll('li'), el =>
    {
      msgId = (el.dataset.id - 0) || msgId
    });

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

    if (this._upl.length)
    {
      for (i = 0; u = this._upl[i], i < this._upl; i++)
      {
        m.files.push(
        {
          name: u.name,
          type: u.mime,
          size: u.size,
          data: u.data
        });
        console.log('File attached: ', this._upl[i]);
      }
    }

    this.ul.innerHTML += this.add([m], 's1');

    // reset composer
    MS._upl = [];
    cmpText.value = '';
    document.getElementById('uploaded').innerHTML = '';
    cmp.classList.remove('focused');

    this.cmpResize();
    this.scrollBottom(50);

    ML.api('message', 'send', {body: msg, messageId: msgId, subject: subj, files: m.files, chatId: MS.chat.id}, json =>
    {
      // mark it as delivered to mail/DB
      MS.ul.querySelector('li:nth-last-child(1) .status').className = 'status s2';
      console.log('send()', json);
    });

    mixpanel.track('Composer - message sent');
  }
};