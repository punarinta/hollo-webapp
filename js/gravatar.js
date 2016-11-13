var Gravatar =
{
  callbacks: {},

  jsonp: function (json)
  {
    if (!json.entry.length) return;

    let h = json.entry[0].hash,
        s = document.getElementById('grava-' + h);

    if (s) s.parentNode.removeChild(s);

    if (typeof Gravatar.callbacks[h] != 'undefined')
    {
      Gravatar.callbacks[h].data = json.entry[0];
      if (typeof Gravatar.callbacks[h].cb == 'function')
      {
        Gravatar.callbacks[h].cb(json.entry[0])
      }
    }
  },

  load (email, cb)
  {
    let h = md5(email);

    if (typeof Gravatar.callbacks[h] != 'undefined')
    {
      if (typeof Gravatar.callbacks[h].cb == 'function')
      {
        Gravatar.callbacks[h].cb(Gravatar.callbacks[h].data);
      }

      return h
    }

    let f = document.createElement('script');

    f.setAttribute('type', 'text/javascript');
    f.setAttribute('src', `https://en.gravatar.com/${h}.json?callback=Gravatar.jsonp`);
    f.setAttribute('id', 'grava-' + h);

    Gravatar.callbacks[h] =
    {
      cb: cb,
      data: null
    };

    document.querySelector('head').appendChild(f);

    return h;
  },
};