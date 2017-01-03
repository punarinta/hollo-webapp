//  MUST BE IN ES5

var ML =
{
  sessionId: null,
  _loaded: [],
  ws: null,
  _wsOpened: 0,

  api: function (endpoint, method, data, callback, error, failure)
  {
    var r = new XMLHttpRequest(), ps = null, pl;

    r.open(method ? 'POST' : 'GET', CFG.apiRoot + endpoint, true);
    r.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    if (typeof ML.sessionId == 'string')
    {
      r.setRequestHeader('Token', ML.sessionId);
    }

    r.onload = function ()
    {
      var r = this.response.toString(), status = this.status;
      try
      {
        var json = JSON.parse(r);
      }
      catch (e)
      {
        ML.emit('busybox');
        console.log('Not JSON:', r);
        ML.emit('messagebox', {html: [200, 500].indexOf(status) != -1 ? r : ('HTTP ' + status)});
        return;
      }

      if (status >= 200 && status < 400)
      {
        if (callback) callback(json.data);
      }
      else
      {
        ML.emit('busybox');
        console.log('Status:', status);
        if (status != 401)
        {
          if (failure) failure(json.errMsg);
          else ML.emit('messagebox', {html: json.errMsg});
        }
      }
    };
    r.onerror = function (e)
    {
      ML.emit('busybox');
      console.log('onerror()', e.error);
      if (error) error(e.error)
    };

    if (data && typeof data.pageStart != 'undefined')
    {
      ps = data.pageStart;
      pl = data.pageLength;
    }

    if (method) r.send(JSON.stringify({ 'method': method, 'data': data, 'pageStart': ps, 'pageLength': pl }));
    else r.send();
  },

  getQueryVar: function (v, hashed)
  {
    hashed = hashed || 0;

    var q = hashed ? window.location.hash : window.location.search,
        i, p, vs = q.substring(1).split('&');

    for (i = 0; i < vs.length; i++)
    {
      p = vs[i].split('=');
      if (p[0] == v) return p[1];
    }

    return null;
  },

  ts: function (ts, mode)
  {
    mode = mode || 3;

    var td = new Date(), pfx = '',
        date = new Date(ts * 1000), gy = date.getYear(),
        year = gy >= 100 ? gy - 100 : gy,
        month = '0' + (date.getMonth() + 1),
        day = '0' + date.getDate(),
        hours = '0' + date.getHours(),
        minutes = '0' + date.getMinutes();

    // noinspection JSBitwiseOperatorUsage
    if (mode & 1)
    {
      if (td.getTime() - date.getTime() < 24 * 3600 && td.getDate() == date.getDate()) pfx = 'today';
      else pfx = day.substr(-2) + '.' + month.substr(-2) + '.' + year;
      pfx += ' '
    }

    // noinspection JSBitwiseOperatorUsage
    if (mode & 2)
    {
      pfx += ' ' + hours.substr(-2) + ':' + minutes.substr(-2);
    }

    return pfx;
  },

  uniques: function (arr, sens)
  {
    sens = sens || 1;

    var i = 0, a = [], l = arr.length;
    if (sens)
    {
      for (; i<l; i++)
        if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
          a.push(arr[i]);
    }
    else
    {
      for (; i<l; i++)
        if (a.indexOf(arr[i].toLowerCase()) === -1 && arr[i] !== '')
          a.push(arr[i].toLowerCase());
    }
    return a;
  },

  load: function (fn)
  {
    if (typeof this._loaded[fn] != 'undefined') return;
    ML._loaded[fn] = 1;
    var f = document.createElement('script');
    f.setAttribute('type', 'text/javascript');
    f.setAttribute('src', /*'/' +*/ fn + '.js');
    document.querySelector('head').appendChild(f)
  },

  go: function (r, d)
  {
    var e = new Event('popstate'),
        data = {route: r, data: d};
    history.pushState(data, '', '#' + r);
    e.state = data;
    window.dispatchEvent(e);
  },

  emit: function (eventName, payload)
  {
    var e = new Event('hollo:' + eventName);
    e.payload = payload;
    window.dispatchEvent(e);
  },

  colorHash: function (input)
  {
    var ncc = ML.djb2(input),
        b = (ncc & 0xFF) >> 1, g = (ncc & 0xFF00) >> 9, r = (ncc & 0xFF0000) >> 17;

    ncc = [r + 96, g + 96, b + 96].join(',');
    
    return 'rgb(' + ncc + ')';
  },

  /*isJson: function (testable)
  {
    return testable && /^[\],:{}\s]*$/.test(testable.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
  },*/

  isEmail: function (email)
  {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
  },

  clearName: function (text)
  {
    return text.replace(/[,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').replace(/\s{2,}/g, ' ').split('\\"').join('"')
  },

  xname: function (chat)
  {
    var user, name, nc, count = chat.users.length;

    if (count > 1)
    {
      if (chat.name) name = chat.name;
      else
      {
        name = [];
        for (var n = 0; n < count; n++)
        {
          if (chat.users[n].name)
            user = chat.users[n].name.split(' ')[0];
          else
            user = chat.users[n].email.split('@')[0].split('.')[0];

          name.push(user.charAt(0).toUpperCase() + user.slice(1));
        }

        name = name.join(', ');
      }

      nc = '+' + count;
    }
    else
    {
      if (chat.name) name = chat.name;
      else
      {
        if (chat.users[0]) name = chat.users[0].name ? ML.clearName(chat.users[0].name) : chat.users[0].email.split('@')[0];
        else name = '?';
      }
      nc = name.split(' ');
      nc = nc.length == 1 ? nc[0].charAt(0) : (nc[0].charAt(0) + nc[1].charAt(0));
    }

    return [name, nc]
  },

  prettyEmail: function (email)
  {
    var parts = email.split('@');
    if (parts[0].length > 25) parts[0] = parts[0].substring(0, 25) + '…';
    return parts.join('@')
  },

  // find first parent of the specified type
  par: function (x, type)
  {
    while (x && x.nodeName.toLowerCase() != type)
    {
      if (x == document) break;
      x = x.parentElement;
    }
    return x;
  },

  djb2: function (str)
  {
    var i, hash = 5381;
    for (i = 0; i < str.length; i++) hash = ((hash << 5) + hash) + str.charCodeAt(i)
    return hash;
  }
};
