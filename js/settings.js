var CFG =
{
  apiRoot: 'api.hollo.email',
  
  reset: function ()
  {
    if (!AU.user.settings.flags) AU.user.settings.flags = {};
    CFG._('emojis-replace', 0);
    CFG._('ctrlenter', 1);
    CFG._('newlines', 1);
    CFG._('contact-sort', 'lastTs');  // Options are 'name', 'email', 'lastTs'.
  },

  _: function (key, value)
  {
    if (typeof AU.user.settings.flags[key] == 'undefined' && value) AU.user.settings.flags[key] = value;

    return AU.user.settings.flags[key];
  },

  show: function ()
  {
    var i, page = document.getElementById('page-cfg'), flags = AU.user.settings.flags;

    ML.hidePages();

    // go through settings and setup the fields
    if (flags)
    {
      for (i in flags)
      {
        page.querySelector('#cfg-' + i).checked = flags[i]
      }
    }

    page.style.display = 'block';
  }
};


(function ()
{
  var page = document.getElementById('page-cfg');

  document.querySelector('#page-contacts .head .ava').onclick = function ()
  {
    ML.go('settings')
  };

  page.querySelector('.bar button').onclick = function ()
  {
    ML.go('contacts')
  };
  
  page.querySelector('.slides').onclick = function (e)
  {
    if (e.target.tagName == 'INPUT')
    {
      var key = e.target.id.replace('cfg-', '');
      ML.api('settings', 'update', {flag: {name: key, value: e.target.checked * 1 }}, function ()
      {
        AU.user.settings['flags'][key] = e.target.checked
      });
    }
  }
})();
