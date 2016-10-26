var CFG =
{
  apiRoot: 'app.hollo.email',
  page: document.getElementById('page-cfg'),
  notifierUrl: 'wss://notify.hollo.email:443/',
  
  reset ()
  {
    if (!AU.user.settings.flags) AU.user.settings.flags = {};
    this._('emojis-replace', 0);
    this._('newlines', 1);
    this._('contact-sort-ts', 1);
  },

  _: (key, value) =>
  {
    if (typeof AU.user.settings.flags[key] == 'undefined' && value) AU.user.settings.flags[key] = value;

    return AU.user.settings.flags[key];
  },

  show ()
  {
    var i, flags = AU.user.settings.flags;

    mixpanel.track('Sys - show settings');

    ML.hidePages();

    // go through settings and setup the fields
    if (flags)
    {
      for (i in flags)
      {
        var x = this.page.querySelector('#cfg-' + i);
        if (x) x.checked = flags[i]
      }
    }

    CFG.page.style.display = 'block';
  }
};


// === INIT ===

CO.page.querySelector('.head .ava').onclick = function ()
{
  ML.go('settings')
};

CFG.page.querySelector('.bar button').onclick = function ()
{
  ML.hidePages();
  CO.show(1)
};

CFG.page.querySelector('.slides').onclick = function (e)
{
  if (e.target.tagName == 'INPUT')
  {
    var key = e.target.id.replace('cfg-', '');

    mixpanel.track('Setting - changed', {name: key, value: e.target.checked * 1});

    ML.api('settings', 'update', {flag: {name: key, value: e.target.checked * 1 }}, () =>
    {
      AU.user.settings['flags'][key] = e.target.checked
    });
  }
};
