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
      var that = this, i = 0, w = this.value.trim().split(' ').slice(-1)[0].toLowerCase().replace(/[_\W]+/g, '');
      if (typeof EMJ[w] != 'undefined')
      {
        for (; i < EMJ[w].length; i++)
        {
          var em = document.createElement('div');
          em.innerText = EMJ[w][i];
          em.dataset.w = w;
          em.classList.add('emj-' + w);
          setTimeout(function(o)
          {
            if (o.parentNode) o.parentNode.removeChild(o);
          }, 5000, em);
          (function(em)
          {
            em.onclick = function ()
            {
              // replace the last occurrence of a word with an emoji
              var pat = new RegExp('(\\b' + this.dataset.w + '\\b)(?!.*\\b\\1\\b)', 'i');
              that.value = that.value.replace(pat, this.innerText);
              Array.prototype.forEach.call(document.querySelectorAll('.emj-' + w), function(el)
              {
                el.parentNode.removeChild(el);
              });
              that.focus();
            };
          })(em);
          document.querySelector('#page-msgs .emojis').appendChild(em);
        }
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

  // === POSTING ===

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
      for (var i = 0, u; u = MS._upl[i]; i++)
      {
        m.files.push(
        {
          name: u.name,
          type: u.mime,
          size: u.size,
          extId: 'foobar',
          data: u.data
        });
        console.log('File attached: ', MS._upl[i]);
      }
    }

    MS.add([m], 'bottom');

    ML.api('message', 'send', {body: msg, messageId:msgId, subject: subj}, function (json)
    {
      console.log('send()', json);

      // reset composer
      MS._upl = [];
      cmpText.value = '';
      document.getElementById('uploaded').innerHTML = '';
      cmpText.dispatchEvent(new Event('autosize:update'));
      cmpText.dispatchEvent(new Event('autosize:resized'));

      // close topic picker
      cmp.querySelector('.subjects').classList.remove('opened');
    });
  };

  cmp.querySelector('.picker').onclick = function ()
  {
    cmp.querySelector('.subjects').classList.toggle('opened');
    cmpText.focus();
  };

  cmp.querySelector('#uploaded').onclick = function (e)
  {
    if (!e.target.classList.contains('file-icon')) return;

    for (var i in MS._upl)
    {
      if (MS._upl[i].hash == e.target.dataset.hash)
      {
        ML.demo(MS._upl[i].data, MS._upl[i].mime);
        break;
      }
    }
  };


  // === FILE UPLOADER ===

  cmp.querySelector('#upload').onchange = function (e)
  {
    var files = e.target.files;

    for (var i = 0, f; f = files[i]; i++)
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
          div.className = 'ndf file-icon';
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
          cmpText.dispatchEvent(new Event('autosize:update'));
          cmpText.dispatchEvent(new Event('autosize:resized'));
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
  };
})();