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
};