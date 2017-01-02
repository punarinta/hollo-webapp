//  MUST BE IN ES5

var $locales = [];

function _ (code, vars, options)
{
  var text = ($locales[CFG.locale] && $locales[CFG.locale][code] != undefined) ? $locales[CFG.locale][code] : (typeof $locales['en-US'][code] != 'undefined' ? $locales['en-US'][code] : code);

  if (vars)
  {
    var i, items = text.split('%s');
    text = items[0];
    for (i = 0; i < vars.length; i++)
    {
      text += vars[i] + items[i + 1]
    }
  }

  if (!options) options = {};

  if (text.indexOf("\n") == -1 || options.singleLine)
  {
    return text
  }
  else
  {
    var i, hText = [];
    text = text.split("\n");
    for (i in text)
    {
      hText.push(text[i]);
      hText.push(h('br'));
    }

    return hText
  }
}
