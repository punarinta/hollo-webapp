var ML =
{
  sessionId: null,
  user:
  {
    id: null,
    email: null
  },

  apiRoot: '',

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
  }
};
