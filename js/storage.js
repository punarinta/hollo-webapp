//  MUST BE IN ES5

/*
    This is a storage engine for chats, users and avatars.
    The idea here is to move data storage and data processing logic to the frontend.
*/

var A =
{
  data: {},

  get: function (email)
  {
    if (typeof A.data[email] !== 'undefined')
    {
      // it is important to return an object here to distinguish between 'not yet present' and 'no avatar'
      return { url: A.data[email] };
    }

    return null;
  },

  set: function (email, url)
  {
    A.data[email] = url;
  }
},

U =
{
  data: [],

  get: function (id)
  {
    for (var i in U.data) if (U.data[i].id == id) return U.data[i];
    return null;
  },

  set: function (id, data)
  {
    var i, j, found;
    if (id)
    {
      found = false;
      if (data._id) data.id = data._id;
      for (i in U.data)
      {
        if (U.data[i].id == data.id)
        {
          found = true;
          U.data[i] = data;
          break;
        }
      }
      if (!found) C.data.push(data)
    }
    else { for (i in data)
    {
      if (data[i]._id) { data[i].id = data[i]._id; delete data[i]._id }

      found = false;
      for (j in U.data)
      {
        if (!U.data[j]) U.data.splice(j, 1);
        else if (U.data[j].id == data[i].id) { U.data[j] = data[i]; found = true }
      }

      if (!found) U.data.push(data[i])
    }}

    var jsonString = JSON.stringify(U.data);

    console.log('Storage used for users: %s kB', Math.round(jsonString.length / 1024));
    // localStorage.setItem('users', jsonString);

    ML.emit('users:update');
  },

  filter: function (email)
  {
    if (!email) return U.data;

    var i, items = [];

    for (i in U.data)
    {
      if (U.data[i].email.toLowerCase().indexOf(email) != -1 || U.data[i].name && U.data[i].name.toLowerCase().indexOf(email) != -1)
      {
        items.push(U.data[i]);
      }
    }

    return items;
  }
},

C =
{
  data: [],

  get: function (id)
  {
    for (var i in C.data) if (C.data[i].id == id) return C.data[i];
    return null;
  },

  set: function (me, id, data)
  {
    var i, j, found, deadLine = Math.floor(Date.now() / 1000) - 6 * 2592000;

    if (id)
    {
      found = false;
      if (data._id) data.id = data._id;
      for (i in C.data)
      {
        if (C.data[i].id == data.id)
        {
          found = true;
          C.data[i] = data;
          break;
        }
      }
      if (!found) C.data.push(data)
    }
    else { for (i in data)
    {
      if (data[i]._id) { data[i].id = data[i]._id; delete data[i]._id }

      found = false;
      for (j in C.data)
      {
        if (!C.data[j]) C.data.splice(j, 1);
        else if (C.data[j].id == data[i].id) { C.data[j] = data[i]; found = true }
      }

      if (!found) C.data.push(data[i])
    }}

    // remove old chats and messages
    for (i in C.data)
    {
      if (!C.data[i] || C.data[i].lastTs < deadLine)
      {
        C.data.splice(i, 1);
        continue;
      }

      if (C.data[i].messages) for (j in C.data[i].messages)
      {
        if (!C.data[i].messages[j] || C.data[i].messages[j].ts < deadLine) C.data[i].messages.splice(j, 1);
      }
    }

    // enrich
    for (i in C.data)
    {
      // TODO: avoid loop if already enriched
      if (me) for (j in C.data[i].users)
      {
        if (C.data[i].users[j].id == me.id)
        {
          // set flags for yourself
          C.data[i].read = C.data[i].users[j].read;
          C.data[i].muted = C.data[i].users[j].muted;

          // just remove yourself, it's obvious
          C.data[i].users.splice(j, 1);

          break;
        }
      }

      if (C.data[i].messages) C.data[i].messages = C.data[i].messages.sort(function (a, b)
      {
        return b.ts - a.ts
      })
    }

    C.data = C.data.sort(function (a, b)
    {
      if (a.read && !!a.read > !!b.read) return 1;

      return b.lastTs - a.lastTs;
    });

    var jsonString = JSON.stringify(C.data);

    console.log('Storage used for chats: %s kB', Math.round(jsonString.length / 1024));
    // localStorage.setItem('chats', jsonString);

    for (i in C.data)
    {
      if (me) for (j in C.data[i].users)
      {
        var u = C.data[i].users[j].id == me.id ? me : U.get(C.data[i].users[j].id);
        C.data[i].users[j].name = u.name;
        C.data[i].users[j].email = u.email;
      }
    }

    // for debugging
    // console.log('Storage used for chats: %s kB', Math.round(JSON.stringify(C.data).length / 1024));

    ML.emit('chat:update');
  },

  load: function (me)
  {
    C.data = JSON.parse(localStorage.getItem('chats')) || [];
    C.sync(me);
  },

  sync: function (me, cb)
  {
    var i, lastTs = 0;

    for (i in C.data) if (C.data[i] && C.data[i].lastTs)
    {
      lastTs = Math.max(lastTs, C.data[i].lastTs);
    }

    ML.api('chat', 'getAllData', {lastTs: lastTs}, function (json)
    {
      U.set(null, json.users);
      C.set(me, null, json.chats);
      if (cb) cb();
    });
  },

  filter: function (options)
  {
    var i, j, items = [], takeFrom = C.data,

    muted = typeof options.muted == 'undefined' ? null : options.muted,
    read  = typeof options.read  == 'undefined' ? null : options.read,
    email = typeof options.email == 'undefined' ? null : options.email;

    if (muted !== null)
    {
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
      for (i in U.data)
      {
        if (U.data[i].name && U.data[i].name.toLowerCase().indexOf(email) != -1 || U.data[i].email.toLowerCase().indexOf(email) != -1)
        {
          userIds.push(U.data[i].id);
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
};