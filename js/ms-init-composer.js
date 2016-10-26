{
  var cmp = document.getElementById('composer'),
      cmpText = cmp.querySelector('textarea'),
      scrollDown = function ()
      {
        setTimeout( () =>
        {
          MS.page.querySelector('ul li:last-child').scrollIntoView()
        }, 200);
      };

  cmpText.onclick = function ()
  {
    cmp.classList.add('focused');
    document.querySelector('#page-msgs > ul').classList.add('padded');
    scrollDown();
  };

  cmpText.onfocus = scrollDown;

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

          setTimeout(o =>
          {
            if (o.parentNode) o.parentNode.removeChild(o);
          }, 5000, em);

          (function (em)
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

              Array.prototype.forEach.call(document.querySelectorAll('.emj-' + w), el =>
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

  Array.prototype.forEach.call(cmp.querySelectorAll('*'), el =>
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

  cmp.querySelector('.send').onclick = () => MS.send();

  cmp.querySelector('.picker').onclick = () => SP.show();

  cmp.querySelector('#uploaded').onclick = function (e)
  {
    if (!e.target.classList.contains('file-icon')) return;

    mixpanel.track('Composer - attachment tapped');

    for (let i in MS._upl)
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

          mixpanel.track('Composer - file attached');

          MS.cmpResize();
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }

    this.value = '';
  };
}