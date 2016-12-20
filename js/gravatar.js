//  MUST BE IN ES5

var Gravatar =
{
  callbacks: {},

  jsonp: function (json)
  {
    if (!json.entry.length) return;

    var h = json.entry[0].hash,
        s = document.getElementById('grava-' + h);

    if (s) s.parentNode.removeChild(s);

    if (typeof Gravatar.callbacks[h] != 'undefined')
    {
      Gravatar.callbacks[h].data = json.entry[0];
      if (typeof Gravatar.callbacks[h].cb == 'function')
      {
        Gravatar.callbacks[h].cb(json.entry[0]);
      }
    }
  },

  load: function (email, cb)
  {
    var h = md5(email);

    if (typeof Gravatar.callbacks[h] != 'undefined')
    {
      if (typeof Gravatar.callbacks[h].cb == 'function')
      {
        Gravatar.callbacks[h].cb(Gravatar.callbacks[h].data);
      }

      return h;
    }

    var f = document.createElement('script');

    f.setAttribute('type', 'text/javascript');
    f.setAttribute('src', 'https://en.gravatar.com/' + h + '.json?callback=Gravatar.jsonp');
    f.setAttribute('id', 'grava-' + h);
    f.onerror = function ()
    {
      if (typeof Gravatar.callbacks[h] != 'undefined' && typeof Gravatar.callbacks[h].cb == 'function')
      {
        var el = document.getElementById('grava-' + h);
        el.parentElement.removeChild(el);
        Gravatar.callbacks[h].cb(0);
      }
    };

    Gravatar.callbacks[h] =
    {
      cb: cb,
      data: null
    };

    document.querySelector('head').appendChild(f);

    return h;
  }
};