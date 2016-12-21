//  MUST BE IN ES5

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
  data: {},

  get: function (id)
  {
    return typeof U.data[id] == 'undefined' ? null : U.data[id];
  },

  set: function (id, data)
  {
    if (id) U.data[id] = data;
    else for (var i in data) U.data[data[i].id] = data[i];
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
  data: {},

  get: function (id)
  {
    return typeof C.data[id] == 'undefined' ? null : C.data[id];
  },

  set: function (id, data)
  {
    var i, j, deadLine = Math.floor(Date.now()/1000) - 6 * 2592000;

    if (id) C.data[id] = data;
    else for (i in data) C.data[data[i].id] = data[i];

    C.data = C.data(function (a, b)
    {
      if (a.read > b.read) return -1;

      if (!a.last || !b.last) return 0;

      return a.last.ts - b.last.ts;
    });

    // remove old chats and messages
    for (i in C.data)
    {
      if (C.data[i].lastTs < deadLine) delete C.data[i];
      if (C.data[i].messages) for (j in C.data[i].messages)
      {
        if (C.data[i].messages[j].ts < deadLine) delete C.data[i].messages[j];
      }
    }

    localStorage.setItem('chats', C.data);
  },

  load: function ()
  {
    C.data = localStorage.getItem('chats') || {};
    C.sync();
  },

  sync: function ()
  {
    var i, lastTs = 0;

    for (i in C.data)
    {
      lastTs = Math.max(lastTs, C.data[i].lastTs);
    }

    ML.api('chat', 'getAllData', {lastTs: lastTs}, function (json)
    {
      U.set(null, json.users);
      C.set(null, json.chats);
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