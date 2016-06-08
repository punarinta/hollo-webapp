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
  document.querySelector('#page-contacts .head .ava').onclick = function ()
  {
    // ML.go('settings')
  }
})();