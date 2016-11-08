var Gravatar =
{
  callback: {},

  jsonp: function (json)
  {
    if (!json.entry.length) return;

    let h = json.entry[0].hash,
        s = document.getElementById('grava-' + h);

    if (s) s.parentNode.removeChild(s);

    if (typeof Gravatar.callback[h] != 'undefined')
    {
      Gravatar.callback[h].data = json.entry[0];
      if (typeof Gravatar.callback[h].cb == 'function')
      {
        Gravatar.callback[h].cb(json.entry[0])
      }
    }
  },

  load (email, cb)
  {
    let h = md5(email);

    if (typeof Gravatar.callback[h] != 'undefined')
    {
      if (typeof Gravatar.callback[h].cb == 'function')
      {
        Gravatar.callback[h].cb(Gravatar.callback[h].data);
      }

      return h
    }

    let f = document.createElement('script');

    f.setAttribute('type', 'text/javascript');
    f.setAttribute('src', `https://en.gravatar.com/${h}.json?callback=Gravatar.jsonp`);
    f.setAttribute('id', 'grava-' + h);

    Gravatar.callback[h] =
    {
      cb: cb,
      data: null
    };

    document.querySelector('head').appendChild(f);

    return h;
  },
};