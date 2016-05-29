var ML =
{
  apiRoot: document.location.hostname.replace('app.', 'api.'),
  state:
  {
    muted: 0
  },
  _loaded: [],
  _mbox : null,
  _grava: {},

  api: function (endpoint, method, data, callback)
  {
    var r = new XMLHttpRequest(), ps = null, pl;

    r.open('POST', 'https://' + ML.apiRoot + '/api/' + endpoint, true);
    r.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

    if (AU.sessionId)
    {
      r.setRequestHeader('Token', AU.sessionId.toString());
    }
    
    r.onload = function ()
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
          if (this.status != 401) ML.mbox(json.errMsg);
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

    if (data && typeof data.pageStart != 'undefined')
    {
      ps = data.pageStart;
      pl = data.pageLength;
    }

    r.send(JSON.stringify({ 'method': method, 'data': data, 'pageStart': ps, 'pageLength': pl }));
  },

  getQueryVar: function (v)
  {
    var q = window.location.search.substring(1),
        i, p, vs = q.split('&');

    for (i = 0; i < vs.length; i++)
    {
      p = vs[i].split('=');
      if (p[0] == v) return p[1];
    }
    return null;
  },

  ts: function (ts)
  {
    var td = new Date(), pfx,
        date = new Date(ts * 1000), gy = date.getYear(),
        year = gy >= 100 ? gy - 100 : gy,
        month = '0' + (date.getMonth() + 1),
        day = '0' + date.getDate(),
        hours = '0' + date.getHours(),
        minutes = '0' + date.getMinutes();

    if (td.getTime() - date.getTime() < 24 * 3600 && td.getDate() == date.getDate()) pfx = 'today';
    else pfx = day.substr(-2) + '.' + month.substr(-2) + '.' + year;

    return pfx + ' ' + hours.substr(-2) + ':' + minutes.substr(-2);
  },

  uniques: function (arr, sens)
  {
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
    if (typeof ML._loaded[fn] != 'undefined') return;
    ML._loaded[fn] = 1;
    var f = document.createElement('script');
    f.setAttribute('type', 'text/javascript');
    f.setAttribute('src', '/' + fn + '.js');
    document.querySelector('head').appendChild(f)
  },

  gravaCb: function (json)
  {
    if (!json.entry.length) return;

    var h = json.entry[0].hash,
        s = document.getElementById('grava-' + h);

    if (s) s.parentNode.removeChild(s);

    if (typeof ML._grava[h] != 'undefined')
    {
      ML._grava[h].data = json.entry[0];
      if (typeof ML._grava[h].cb == 'function') ML._grava[h].cb(json.entry[0])
    }
  },

  grava: function (m, cb)
  {
    var f = document.createElement('script'), h = md5(m);

    if (typeof ML._grava[h] != 'undefined')
    {
      if (typeof ML._grava[h].cb == 'function') ML._grava[h].cb(ML._grava[h].data);
      return h
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
  
  mbox: function (msg, mode, cb)
  {
    /*
    Modes:
    0 - OK
    1 - OK, Cancel
     */
    
    var m = document.getElementById('mbox');
    m.querySelector('.ok').style.display = 'block';
    m.querySelector('.cancel').style.display = mode ? 'block' : 'none';
    m.style.display = 'flex';
    m.querySelector('.body').innerHTML = msg;
    ML._mbox = cb || function () {};
  },
  
  demo: function (data, mime)
  {
    if (mime && mime.split('/')[0] != 'image') return;
    var box = document.getElementById('demo');
    box.style.display = data ? 'flex' : 'none';
    box.querySelector('.img').style.backgroundImage = 'url(' + data + ')';
  },
  
  go: function (r, d)
  {
    for (var i = 2; i--;)
      history.pushState({route: r, data: d}, '', '/' + r);

    history.go(-1)
  },

  colorHash: function (input)
  {
    var ncc = parseInt(md5(input).substr(0, 6), 16),
        b = ncc & 0xFF, g = (ncc >> 8) & 0xFF, r = ncc >> 16;

    ncc = [(r >> 1) + 96, (g >> 1) + 96, (b >> 1) + 96].join(',');
    
    return 'rgb(' + ncc + ')';
  }
};

var PP =
{
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
