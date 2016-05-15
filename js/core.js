var ML =
{
  apiRoot: document.location.hostname.replace('app.', 'api.'),
  sessionId: null,
  contact: null,
  user:
  {
    id: null,
    email: null
  },
  state:
  {
    muted: 0
  },
  _loaded: [],
  _mbox : function () {},

  api: function (endpoint, method, data, callback)
  {
    var r = new XMLHttpRequest();

    r.open('POST', 'https://' + ML.apiRoot + '/api/' + endpoint, true);
    r.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    if (ML.sessionId)
    {
      r.setRequestHeader('Token', ML.sessionId.toString());
    }
    r.onload = function()
    {
      var r = this.response.toString();
      if (/^[\],:{}\s]*$/.test(r.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '')))
      {
        var json = JSON.parse(r);
        if (this.status >= 200 && this.status < 400)
        {
          callback(json.data);
        }
        else
        {
          console.log('Status: ', this.status);
          ML.mbox(json.errMsg);
        }
      }
      else
      {
        console.log('Malformed server response:', r);
        ML.mbox(r);
      }
    };
    r.onerror = function(e)
    {
      console.log('Cannot connect to server:', e.error);
    };
    r.send(JSON.stringify({ 'method': method, 'data': data }));
  },

  getQueryVar: function (v)
  {
    var query = window.location.search.substring(1),
        i, vars = query.split('&');

    for (i = 0; i < vars.length; i++)
    {
      var pair = vars[i].split('=');
      if (pair[0] == v) { return pair[1]; }
    }
    return null;
  },

  ts: function (ts)
  {
    var td = new Date(), pfx,
        date = new Date(ts * 1000),
        year = date.getYear() >= 100 ? date.getYear() - 100 : date.getYear(),
        month = '0' + (date.getMonth() + 1),
        day = '0' + date.getDate(),
        hours = '0' + date.getHours(),
        minutes = '0' + date.getMinutes();

    if (td.getTime() - date.getTime() < 24*3600 && td.getDate() == date.getDate()) pfx = 'today';
    else pfx = day.substr(-2) + '.' + month.substr(-2) + '.' + year;

    return pfx + ' ' + hours.substr(-2) + ':' + minutes.substr(-2);
  },

  uniques: function(arr, sens)
  {
    var i=0, a = [], l=arr.length;
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
    if (typeof ML._loaded[fn] != 'undefined') return;
    ML._loaded[fn] = 1;
    var f = document.createElement('script');
    f.setAttribute('type', 'text/javascript');
    f.setAttribute('src', '/' + fn + '.js');
    document.querySelector('head').appendChild(f)
  },

  _grava: {},

  gravaCb: function (json)
  {
    if (!json.entry.length) return;
    var h = json.entry[0].hash, s = document.getElementById('grava-' + h);
    if (s) s.parentNode.removeChild(s);

    ML._grava[h].data = json.entry[0];

    if (typeof ML._grava[h].cb == 'function') ML._grava[h].cb(json.entry[0])
  },

  grava: function (m, cb)
  {
    var f = document.createElement('script'), h = md5(m);

    if (typeof ML._grava[h] != 'undefined')
    {
      if (typeof ML._grava[h].cb == 'function') ML._grava[h].cb(ML._grava[h].data);
      return
    }

    f.setAttribute('type', 'text/javascript');
    f.setAttribute('src', 'https://en.gravatar.com/' + h + '.json?callback=ML.gravaCb');
    f.setAttribute('id', 'grava-' + h);
    ML._grava[h] =
    {
      cb: cb,
      data: null
    };
    document.querySelector('head').appendChild(f);

    return h;
  },
  
  mbox: function (msg, mode, callback)
  {
    var mbox = document.getElementById('mbox');
    mbox.querySelector('.btn.ok').style.display = 'block';
    mbox.style.display = 'flex';
    mbox.querySelector('.body').innerHTML = msg;
    if (callback) ML._mbox = callback;
  },
  
  go: function (r)
  {
    history.pushState({route:r}, '', '/' + r);
    history.pushState({route:r}, '', '/' + r);
    history.go(-1)
  }
};

var PP =
{
  onKey: function (sel, code, callback)
  {
    document.querySelector(sel).onkeydown = function (ev)
    {
      if (ev.keyCode == code) callback();
    };
  },
  // find first parent of the specified type
  par: function (x, type)
  {
    while (x.nodeName.toLowerCase() != type)
    {
      if (x == document) break;
      x = x.parentElement;
    }
    return x;
  }
};
