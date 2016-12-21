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
    var i, j;
    if (id) { for (i in U.data) if (U.data[i].id == (data.id || data._id)) U.data.push(data) }
    else { for (i in data)
    {
      if (data[i]._id) { data[i].id = data[i]._id; delete data[i]._id }

      var found = false;
      for (j in U.data)
      {
        if (!U.data[j]) delete U.data[j];
        else if (U.data[j].id == data[i].id) { U.data[j] = data[i]; found = true }
      }

      if (!found) U.data.push(data[i])
    }}
  },

  filter: function (email)
  {
    var i, items = [];

    for (i in U.data)
    {
      if (email && (U.data[i].email.indexOf(email) != -1 || U.data[i].name && U.data[i].name.indexOf(email) != -1))
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
    var i, j, deadLine = Math.floor(Date.now() / 1000) - 6 * 2592000;

    if (id) { for (i in C.data) if (C.data[i].id == (data.id || data._id)) C.data.push(data) }
    else { for (i in data)
    {
      if (data[i]._id) { data[i].id = data[i]._id; delete data[i]._id }

      var found = false;
      for (j in C.data)
      {
        if (!C.data[j]) delete C.data[j];
        else if (C.data[j].id == data[i].id) { C.data[j] = data[i]; found = true }
      }

      if (!found) C.data.push(data[i])
    }}

    // remove old chats and messages
    for (i in C.data)
    {
      if (!C.data[i] || C.data[i].lastTs < deadLine)
      {
        delete C.data[i];
        continue;
      }
      if (C.data[i].messages) for (j in C.data[i].messages)
      {
        if (!C.data[i].messages[j] || C.data[i].messages[j].ts < deadLine) delete C.data[i].messages[j]
      }
      for (j in C.data[i].users)
      {
        if (C.data[i].users[j].id == me.id)
        {
          // set flags for yourself
          C.data[i].read = C.data[i].users[j].read;
          C.data[i].muted = C.data[i].users[j].muted;
        }
      }
    }

    C.data = C.data.sort(function (a, b)
    {
      if (a.read > b.read) return -1;

      return a.lastTs - b.lastTs;
    });

    var jsonString = JSON.stringify(C.data);

    console.log('Storage used: %s kB', Math.round(jsonString.length / 1024));
    localStorage.setItem('chats', jsonString);
  },

  load: function (me)
  {
    C.data = JSON.parse(localStorage.getItem('chats')) || [];
    C.sync(me);
  },

  sync: function (me)
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
    });
  },

  filter: function (me, muted, email)
  {
    var i, j, items = [],
        muted = muted || null,
        email = email || null;

    // find users first
    var userIds = [];
    if (email !== null) for (i in U.data)
    {
      if (U.data[i].name && U.data[i].name.indexOf(email) != -1 || U.data[i].email.indexOf(email) != -1)
      {
        userIds.push(U.data[i].id);
      }
    }

    for (i in C.data)
    {
      if (email !== null && C.data[i].name && C.data[i].name.indexOf(email) != -1)
      {
        items.push(C.data[i]);
        continue;
      }

      if (C.data[i].messages) for (j in C.data[i].messages)
      {
        if (muted !== null && C.data[i].messages[j].userId == me.id && C.data[i].messages[j].muted == muted)
        {
          items.push(C.data[i]);
          break;
        }
        if (userIds.indexOf(C.data[i].messages[j].userId) != -1)
        {
          items.push(C.data[i]);
          break;
        }
      }
    }

    return items;
  }
};