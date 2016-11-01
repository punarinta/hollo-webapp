MS.page.querySelector('ul').onclick = function (e)
{
  if (e.target.classList.contains('file-icon'))
  {
    mixpanel.track('Message - attachment tapped');
    ML.demo(e.target.dataset.url, e.target.dataset.mime)
  }

  if (e.target.tagName == 'A' && window.self !== window.top)  // if a link is clicked on mobile app
  {
    window.parent.postMessage({cmd: 'openUrl', url: e.target.getAttribute('href', 2), external: true}, '*');
    return false;
  }

  if (e.target.classList.contains('fwd'))
  {
    var li = PP.par(e.target, 'li');

    busy(1);

    // replace message contents with original mail body
    ML.api('message', 'showOriginal', {id: li.dataset.id}, data =>
    {
      li.querySelector('.msg').innerHTML = MS.clearBody(data);
      busy(0);
    });
  }

  if (e.target.classList.contains('ava'))
  {
    var parent = e.target.parentElement;
    parent.querySelector('.ts').classList.toggle('hidden');
    parent.querySelector('.name').classList.toggle('hidden');
  }
};

document.getElementById('msgs-more').onclick = function ()
{
  ML.mbox('Sorry, this is a «PRO» version feature');
};
