var CFG =
{
};

CFG.show = function ()
{
  var page = document.getElementById('page-cfg');

  ML.hidePages();
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
  }
})();
