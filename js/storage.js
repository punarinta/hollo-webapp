//  MUST BE IN ES5

/*
    This is a storage engine for chats, users and avatars.
    The idea here is to move data storage and data processing logic to the frontend.
*/
var $ =
{
  A:
  {
    data: {},

    get: function (email)
    {
      if (typeof $.A.data[email] !== 'undefined')
      {
        // it is important to return an object here to distinguish between 'not yet present' and 'no avatar'
        return { url: $.A.data[email] };
      }

      return null;
    },

    set: function (email, url)
    {
      $.A.data[email] = url;
    }
  },

  U:
  {
    data: [],
    index: [],

    get: function (id)
    {
      var pos = $.U.index.indexOf(id);
      if (pos == -1) return null;
      return $.U.data[pos];
    },

    set: function (id, data)
    {
      var i, rebuild = false;
      if (id)
      {
        var pos = $.U.index.indexOf(data.id);
        if (pos == -1) { $.U.data.push(data); rebuild = true }
        else
        {
          if (data._id) { data.id = data._id; delete data._id }
          $.U.data[pos] = data;
        }
      }
      else
      {
        var j, found;
        for (i in data)
        {
          if (data[i]._id) { data[i].id = data[i]._id; delete data[i]._id }

          found = false;
          for (j in $.U.data)
          {
            if (!$.U.data[j]) $.U.data.splice(j, 1);
            else if ($.U.data[j].id == data[i].id) { $.U.data[j] = data[i]; found = true }
          }

          if (!found) { $.U.data.push(data[i]); rebuild = true }
        }
      }

      // no sorting used => can skip index rebuilding sometimes
      if (rebuild)
      {
        $.U.index = [];
        for (i = 0; i < $.U.data.length; i++)
        {
          $.U.index.push($.U.data[i].id)
        }
      }

      var jsonString = JSON.stringify($.U.data);

      console.log('Storage used for users: %s kB, index size %s', Math.round(jsonString.length / 1024), $.U.index.length);
      // localStorage.setItem('users', jsonString);

      ML.emit('users:update');
    },

    filter: function (email)
    {
      if (!email) return $.U.data;

      var i, items = [];

      for (i in $.U.data)
      {
        if ($.U.data[i].email.toLowerCase().indexOf(email) != -1 || $.U.data[i].name && $.U.data[i].name.toLowerCase().indexOf(email) != -1)
        {
          items.push($.U.data[i]);
        }
      }

      return items;
    }
  },

  C:
  {
    data: [],
    index: [],

    get: function (id)
    {
      var pos = $.C.index.indexOf(id);
      if (pos == -1) return null;
      return $.C.data[pos];
    },

    set: function (me, id, data)
    {
      var i, j, deadLine = Math.floor(Date.now() / 1000) - 6 * 2592000;    // 6 months

      if (id)
      {
        var pos = $.C.index.indexOf(id);
        if (pos == -1) $.C.data.push(data);
        else
        {
          if (data._id) { data.id = data._id; delete data._id }
          $.C.data[pos] = data;
        }
      }
      else
      {
        var found;
        for (i in data)
        {
          if (data[i]._id) { data[i].id = data[i]._id; delete data[i]._id }

          found = false;
          for (j in $.C.data)
          {
            if (!$.C.data[j]) $.C.data.splice(j, 1);
            else if ($.C.data[j].id == data[i].id) { $.C.data[j] = data[i]; found = true; break }
          }

          if (!found) $.C.data.push(data[i])
        }
      }

      // remove old chats and messages
      for (i in $.C.data)
      {
        if (!$.C.data[i] || $.C.data[i].lastTs < deadLine)
        {
          $.C.data.splice(i, 1);
          continue;
        }

        if ($.C.data[i].messages) for (j in $.C.data[i].messages)
        {
          if (!$.C.data[i].messages[j] || $.C.data[i].messages[j].ts < deadLine) $.C.data[i].messages.splice(j, 1);
        }
      }

      // enrich
      for (i in $.C.data)
      {
        // TODO: avoid loop if already enriched
        if (me) for (j in $.C.data[i].users)
        {
          if ($.C.data[i].users[j].id == me.id)
          {
            // set flags for yourself
            $.C.data[i].read = $.C.data[i].users[j].read;
            $.C.data[i].muted = $.C.data[i].users[j].muted;

            // just remove yourself, it's obvious
            $.C.data[i].users.splice(j, 1);

            break;
          }
        }

        if ($.C.data[i].messages) $.C.data[i].messages = $.C.data[i].messages.sort(function (a, b)
        {
          return b.ts - a.ts
        })
      }

      $.C.data = $.C.data.sort(function (a, b)
      {
        var x = (a.read - 0) - (b.read - 0);

        if (x > 0) return 1;
        else if (x < 0) return -1;
        else return (b.lastTs || 0) - (a.lastTs || 0);
      });

      // rebuild index
      $.C.index = [];
      for (i = 0; i < $.C.data.length; i++)
      {
        $.C.index.push($.C.data[i].id)
      }

      var jsonString = JSON.stringify($.C.data);

      console.log('Storage used for chats: %s kB, index size %s', Math.round(jsonString.length / 1024), $.C.index.length);
      // localStorage.setItem('chats', jsonString);

      for (i in $.C.data)
      {
        if (me) for (j in $.C.data[i].users)
        {
          var u = $.C.data[i].users[j].id == me.id ? me : $.U.get($.C.data[i].users[j].id);
          $.C.data[i].users[j].name = u.name;
          $.C.data[i].users[j].email = u.email;
        }
      }

      // for debugging
      // console.log('Storage used for chats: %s kB', Math.round(JSON.stringify($.C.data).length / 1024));

      ML.emit('chat:update');
    },

    remove: function (id)
    {
      for (var i in $.C.data)
      {
        if ($.C.data[i].id == id)
        {
          $.C.data.splice(i, 1);
          return true;
        }
      }
      return false;
    },

    load: function (me)
    {
      $.C.data = JSON.parse(localStorage.getItem('chats')) || [];
      $.C.sync(me);
    },

    sync: function (me, cb)
    {
      var i, lastTs = 0;

      for (i in $.C.data) if ($.C.data[i] && $.C.data[i].lastTs)
      {
        lastTs = Math.max(lastTs, $.C.data[i].lastTs);
      }

      ML.emit('busybox', 1);

      ML.api('chat', 'getAllData', {lastTs: lastTs}, function (json)
      {
        $.U.set(null, json.users);
        $.C.set(me, null, json.chats);
        ML.emit('busybox');
        if (cb) cb();
      });
    },

    filter: function (options)
    {
      var i, j, takeFrom, items = $.C.data, options = options || {},

      muted = typeof options.muted == 'undefined' ? null : options.muted,
      read  = typeof options.read  == 'undefined' ? null : options.read,
      email = typeof options.email == 'undefined' ? null : options.email;

      if (muted !== null)
      {
        takeFrom = items;
        items = [];

        for (i in takeFrom)
        {
          if (!!takeFrom[i].muted == !!muted)
          {
            items.push(takeFrom[i]);
          }
        }
      }

      if (read !== null)
      {
        takeFrom = items;
        items = [];

        for (i in takeFrom)
        {
          if (!!takeFrom[i].read == !!read)
          {
            items.push(takeFrom[i]);
          }
        }
      }

      if (email !== null)
      {
        takeFrom = items;
        items = [];

        var userIds = [];
        email = email.toLowerCase();

        // find users first
        for (i in $.U.data)
        {
          if ($.U.data[i].name && $.U.data[i].name.toLowerCase().indexOf(email) != -1 || $.U.data[i].email.toLowerCase().indexOf(email) != -1)
          {
            userIds.push($.U.data[i].id);
          }
        }

        for (i in takeFrom)
        {
          if (email !== null && takeFrom[i].name && takeFrom[i].name.toLowerCase().indexOf(email) != -1)
          {
            items.push(takeFrom[i]);
            continue;
          }

          if (takeFrom[i].messages) for (j in takeFrom[i].messages)
          {
            if (userIds.indexOf(takeFrom[i].messages[j].userId) != -1)
            {
              items.push(takeFrom[i]);
              break;
            }
          }
        }
      }

      return items;
    }
  }
};