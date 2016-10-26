var ML =
{
  state:
  {
    muted: 0,
    currentDemo: null,
    widthMode: window.innerWidth > 768
  },
  _loaded: [],
  _mbox : null,
  _grava: {},
  ws: null,
  _wsOpened: 0,

  isJson (testable)
  {
    return testable && /^[\],:{}\s]*$/.test(testable.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
  },

  api (endpoint, method, data, callback, error)
  {
    let r = new XMLHttpRequest(), ps = null, pl;

    r.open('POST', `https://${CFG.apiRoot}/api/${endpoint}`, true);
    r.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

    if (AU.sessionId)
    {
      r.setRequestHeader('Token', AU.sessionId.toString());
    }
    
    r.onload = function ()
    {
      var r = this.response.toString();
      if (ML.isJson(r))
      {
        var json = JSON.parse(r);
        if (this.status >= 200 && this.status < 400)
        {
          callback(json.data);
        }
        else
        {
          console.log('Status:', this.status);
          if (this.status != 401)
          {
            ML.mbox(json.errMsg);
            busy(0);
          }
        }
      }
      else
      {
        console.log('Not JSON:', r);
        ML.mbox([200, 500].indexOf(this.status) != -1 ? r : ('HTTP ' + this.status));
        // prevent app lock
        busy(0);
      }
    };
    r.onerror = function (e)
    {
      console.log('onerror()', e.error);
      if (error) error(e.error)
    };

    if (data && typeof data.pageStart != 'undefined')
    {
      ps = data.pageStart;
      pl = data.pageLength;
    }

    r.send(JSON.stringify({ 'method': method, 'data': data, 'pageStart': ps, 'pageLength': pl }));
  },

  getQueryVar (v)
  {
    let q = window.location.search.substring(1),
        i, p, vs = q.split('&');

    for (i = 0; i < vs.length; i++)
    {
      p = vs[i].split('=');
      if (p[0] == v) return p[1];
    }
    return null;
  },

  ts (ts, mode = 3)
  {
    let td = new Date(), pfx = '',
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

  uniques (arr, sens)
  {
    let i = 0, a = [], l = arr.length;
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

  load (fn)
  {
    if (typeof this._loaded[fn] != 'undefined') return;
    ML._loaded[fn] = 1;
    let f = document.createElement('script');
    f.setAttribute('type', 'text/javascript');
    f.setAttribute('src', '/' + fn + '.js');
    document.querySelector('head').appendChild(f)
  },

  gravaCb: function (json)
  {
    if (!json.entry.length) return;

    let h = json.entry[0].hash,
        s = document.getElementById('grava-' + h);

    if (s) s.parentNode.removeChild(s);

    if (typeof ML._grava[h] != 'undefined')
    {
      ML._grava[h].data = json.entry[0];
      if (typeof ML._grava[h].cb == 'function')
      {
        ML._grava[h].cb(json.entry[0])
      }
    }
  },

  grava (m, cb)
  {
    let f = document.createElement('script'), h = md5(m);

    if (typeof this._grava[h] != 'undefined')
    {
      if (typeof this._grava[h].cb == 'function')
      {
        this._grava[h].cb(this._grava[h].data);
      }
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
  
  mbox (msg, mode, cb)
  {
    /*
    Modes:
    0 - OK
    1 - OK, Cancel
     */
    
    let m = document.getElementById('mbox');
    m.querySelector('.ok').style.display = 'block';
    m.querySelector('.cancel').style.display = mode ? 'block' : 'none';
    m.style.display = 'flex';
    m.querySelector('.body').innerHTML = msg;
    ML._mbox = cb || function () {};

    return m;
  },
  
  demo (data, mime, canDelete)
  {
    var box = document.getElementById('demo'),
        viewer = box.querySelector('.img');

    box.querySelector('.bar').style.display = canDelete ? 'flex' : 'none';

    if (mime)
    {
      if (mime.split('/')[0] == 'image')
      {
        viewer.style.background = `transparent url(${data}) no-repeat center`;
        viewer.innerHTML = '';
      }
      else
      {
        viewer.style.background = this.colorHash(mime);
        viewer.innerHTML = mime.split('/')[1];
        data = 1;
      }
    }

    box.style.display = data ? 'flex' : 'none';
  },
  
  go (r, d)
  {
    for (let i = 2; i--;)
    {
      history.pushState({route: r, data: d}, '', '/' + r);
    }

    history.go(-1)
  },

  colorHash (input)
  {
    var ncc = parseInt(md5(input).substr(0, 6), 16),
        b = ncc & 0xFF, g = (ncc >> 8) & 0xFF, r = ncc >> 16;

    ncc = [(r >> 1) + 96, (g >> 1) + 96, (b >> 1) + 96].join(',');
    
    return `rgb(${ncc})`;
  },

  unpush (array, index)
  {
    var rest = array.slice(index + 1 || array.length);
    this.length = index < 0 ? array.length + index : index;
    return array.push.apply(array, rest);
  },

  isEmail (email)
  {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
  }
};

var PP =
{
  // find first parent of the specified type
  par (x, type)
  {
    while (x && x.nodeName.toLowerCase() != type)
    {
      if (x == document) break;
      x = x.parentElement;
    }
    return x;
  }
};
