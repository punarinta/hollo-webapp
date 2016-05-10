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
          alert(json.errMsg);
        }
      }
      else
      {
        console.log('Malformed server response:', r);
        alert(r);
      }
    };
    r.onerror = function()
    {
      console.log('cannot connect to server');
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
    var date = new Date(ts * 1000),
        year = date.getYear() >= 100 ? date.getYear() - 100 : date.getYear(),
        month = '0' + (date.getMonth() + 1),
        day = '0' + date.getDate(),
        hours = '0' + date.getHours(),
        minutes = '0' + date.getMinutes();

    return day.substr(-2) + '.' + month.substr(-2) + '.' + year + ' ' + hours.substr(-2) + ':' + minutes.substr(-2);
  },

  uniques: function(arr, sens)
  {
    var a = [];
    if (sens)
    {
      for (var i=0, l=arr.length; i<l; i++)
        if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
          a.push(arr[i]);
    }
    else
    {
      for (var i=0, l=arr.length; i<l; i++)
        if (a.indexOf(arr[i].toLowerCase()) === -1 && arr[i] !== '')
          a.push(arr[i].toLowerCase());
    }
    return a;
  },

  swipedetect: function(el, callback)
  {
    var touchsurface = el,
      swipedir,
      startX,
      startY,
      distX,
      distY,
      dist,
      threshold = 150, //required min distance traveled to be considered swipe
      restraint = 100, // maximum distance allowed at the same time in perpendicular direction
      allowedTime = 300, // maximum time allowed to travel that distance
      elapsedTime,
      startTime,
      handleswipe = callback || function(swipedir) {};

    touchsurface.addEventListener('touchstart', function(e)
    {
      var touchobj = e.changedTouches[0];
      swipedir = 'none';
      dist = 0;
      startX = touchobj.pageX;
      startY = touchobj.pageY;
      startTime = new Date().getTime(); // record time when finger first makes contact with surface
      // e.preventDefault()
    }, false);

    touchsurface.addEventListener('touchmove', function(e)
    {
      //e.preventDefault(); // prevent scrolling when inside DIV
    }, false);

    touchsurface.addEventListener('touchend', function(e)
    {
      var touchobj = e.changedTouches[0];
      distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
      distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
      elapsedTime = new Date().getTime() - startTime; // get time elapsed

      if (elapsedTime <= allowedTime)
      {
        // first condition for awipe met
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint)
        {
          // 2nd condition for horizontal swipe met
          swipedir = (distX < 0)? 'left' : 'right'; // if dist traveled is negative, it indicates left swipe
        }
        else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint)
        {
          // 2nd condition for vertical swipe met
          swipedir = (distY < 0)? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
        }
      }
      handleswipe(swipedir);
      // e.preventDefault()
    }, false)
  },

  load: function (fn)
  {
     var f = document.createElement('script');
     f.setAttribute('type', 'text/javascript');
     f.setAttribute('src', fn + '.js');
     document.getElementsByTagName('head')[0].appendChild(f)
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
  par: function (x, type)
  {
    while (x.nodeName.toLocaleLowerCase() != type)
    {
      if (x == document) break;
      x = x.parentElement;
    }
    return x;
  }
};
