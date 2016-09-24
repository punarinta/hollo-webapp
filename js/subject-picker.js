var SP =
{
  init: function ()
  {
    document.getElementById('sp-modal').onclick = function (el)
    {
      if (el.target.classList.contains('closable')) this.classList.add('hidden')
    }
  },

  show: function ()
  {
    var i, html = '', subj = document.querySelector('#composer .head .cap').value,
        sp = document.getElementById('sp-modal'),
        ul = sp.querySelector('ul');

    for (i in MS.subjects)
    {
      html += '<li><div class="mark' + (MS.subjects[i] == subj ? ' current' : '') + '"></div><div>' + MS.subjects[i] + '</div></li>';
    }

    ul.innerHTML = html;

    sp.classList.remove('hidden')
  }
};

SP.init();
