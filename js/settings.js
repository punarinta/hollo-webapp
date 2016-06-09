var CFG =
{
};

CFG.reset = function ()
{
  if (!AU.user.settings.flags) AU.user.settings.flags = {};
  if (typeof AU.user.settings.flags['emojis-replace'] == 'undefined') AU.user.settings.flags['emojis-replace'] = 0;
  if (typeof AU.user.settings.flags['ctrlenter'] == 'undefined') AU.user.settings.flags['ctrlenter'] = 1;
  if (typeof AU.user.settings.flags['newlines'] == 'undefined') AU.user.settings.flags['newlines'] = 0;
};

CFG.show = function ()
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
