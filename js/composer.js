// === INIT ===

MS.cmpResize = function ()
{
  var cmpText = document.querySelector('#composer textarea');
  cmpText.dispatchEvent(new Event('autosize:update'));
  cmpText.dispatchEvent(new Event('autosize:resized'));
};

MS.send = function ()
{
  var u, i, cmp = document.getElementById('composer'),
      cmpText = cmp.querySelector('textarea');

  // send a message
  var msg = cmpText.value, subj = cmp.querySelector('.cap').value, msgId = null;

  if (!msg.length && !MS._upl.length)
  {
    ML.mbox('Nothing to send');
    return;
  }

  // try to find last message with real id
  Array.prototype.forEach.call(document.querySelectorAll('#page-msgs > ul li'), function (el)
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

  if (MS._upl.length)
  {
    for (i = 0; u = MS._upl[i]; i++)
    {
      m.files.push(
      {
        name: u.name,
        type: u.mime,
        size: u.size,
        // extId: 'x',  // Is this necessary at all?
        data: u.data
      });
      console.log('File attached: ', MS._upl[i]);
    }
  }

  var lastLi = MS.add([m], 'bottom', 's1');

  ML.api('message', 'send', {body: msg, messageId: msgId, subject: subj, files: m.files, chatId: MS.chat.id}, function (json)
  {
    console.log('send()', json);

    // reset composer
    MS._upl = [];
    cmpText.value = '';
    document.getElementById('uploaded').innerHTML = '';
    cmp.classList.remove('focused');
    MS.cmpResize();

    lastLi.querySelector('.status').className = 'status s2'
  });
};


// === INIT ===

(function ()
{
  var cmp = document.getElementById('composer'),
      cmpText = cmp.querySelector('textarea');

  cmpText.onclick = function ()
  {
    cmp.classList.add('focused');
    document.querySelector('#page-msgs > ul').classList.add('padded')
  };

  cmpText.onkeyup = function (e)
  {
    if (e.keyCode == 13 && e.ctrlKey)
    {
      MS.send()
    }

    if (/[^a-zA-Z0-9-_]/.test(this.value.slice(-1)) && e.keyCode > 31)
    {
      var that = this, i = 0, w = this.value.trim().split(' ').slice(-1)[0].toLowerCase().replace(/[_\W]+/g, '');

      if (typeof EMJ[w] != 'undefined')
      {
        var emBox = document.createElement('div');
        
        for (; i < EMJ[w].length; i++)
        {
          var em = document.createElement('div');
          em.innerText = EMJ[w][i];
          em.dataset.w = w;
          em.className = 'emoji emj-' + w;
          setTimeout(function(o)
          {
            if (o.parentNode) o.parentNode.removeChild(o);
          }, 5000, em);
          (function(em)
          {
            em.onclick = function (e)
            {
              if (CFG._('emojis-replace'))
              {
                // replace the last occurrence of a word with an emoji
                var pat = new RegExp('(\\b' + this.dataset.w + '\\b)(?!.*\\b\\1\\b)', 'i');
                that.value = that.value.replace(pat, this.innerText);
              }
              else
              {
                that.value += this.innerText + ' ';
              }

              Array.prototype.forEach.call(document.querySelectorAll('.emj-' + w), function(el)
              {
                el.parentNode.removeChild(el);
              });
              that.focus();
              e.stopPropagation();
            };
          })(em);
          emBox.appendChild(em);
        }
        
        // add box to emojibox
        document.querySelector('#page-msgs .emojis').appendChild(emBox);
      }
    }
  };

  autosize(cmpText);

  cmpText.addEventListener('autosize:resized', function (e)
  {
    var h = Math.min(parseInt(e.target.style.height, 10), window.innerHeight * .3),
        f = MS._upl.length ? 78 : 0,
        extra = h == window.innerHeight * .3 ? 0 : 21;

    cmp.style.height = h + 'px';
    cmp.querySelector('.emojis').style.bottom = f + h + 41 + 'px';
    cmp.querySelector('.head').style.bottom = f + h - extra + 'px';
    cmp.querySelector('.send').style.bottom = (f + h - 21) / 2 + 'px';
    cmpText.style.bottom = f - extra + 'px';
  });

  Array.prototype.forEach.call(cmp.querySelectorAll('*'), function (el)
  {
    el.classList.add('ndf');
  });

  document.onclick = function (e)
  {
    // 'ndf' for 'no defocus'
    if (e.target.classList.contains('ndf')) return;

    cmp.classList.remove('focused');
    document.querySelector('#page-msgs > ul').classList.remove('padded')
  };

  // === POSTING ===

  cmp.querySelector('.send').onclick = MS.send;

  cmp.querySelector('.picker').onclick = SP.show;

  cmp.querySelector('#uploaded').onclick = function (e)
  {
    if (!e.target.classList.contains('file-icon')) return;

    for (var i in MS._upl)
    {
      if (MS._upl[i].hash == e.target.dataset.hash)
      {
        ML.state.currentDemo = MS._upl[i].hash;
        ML.demo(MS._upl[i].data, MS._upl[i].mime, 1);
        break;
      }
    }
  };

  document.querySelector('#demo .delete').onclick = function ()
  {
    var i, el = cmp.querySelector('.hash-' + ML.state.currentDemo);

    el.parentNode.removeChild(el);

    // remove deleted file from _upl array
    for (i in MS._upl)
    {
      if (MS._upl[i] && MS._upl[i].hash == ML.state.currentDemo)
      {
        MS._upl = ML.unpush(MS._upl, i);
        if (typeof MS._upl.constructor !== Array) MS._upl = []
      }
    }

    ML.demo(0);
    MS.cmpResize();
  };


  // === FILE UPLOADER ===

  cmp.querySelector('#upload').onchange = function (e)
  {
    var i, f, files = e.target.files;

    for (i = 0; f = files[i]; i++)
    {
      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function (f)
      {
        return function (e)
        {
          var b64 = e.target.result;
          console.log('File read:', f, e);

          // Render thumbnail.
          var div = document.createElement('div');
          div.className = 'ndf file-icon hash-' + md5(b64);
          div.dataset.hash = md5(b64);

          if (f.type.match('image.*'))
          {
            div.style.background = 'url(' + b64 + ')'
          }
          else
          {
            div.style.background = ML.colorHash(f.type);
            div.innerHTML = f.type.split('/')[1]
          }

          document.getElementById('uploaded').insertBefore(div, null);

          MS._upl.push(
          {
            name: f.name,
            mime: f.type,
            size: f.size,
            data: b64,
            hash: md5(b64)
          });

          MS.cmpResize();
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }

    this.value = '';
  };
})();