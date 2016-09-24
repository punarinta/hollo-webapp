var SP =
{
  init: function ()
  {
    document.getElementById('sp-modal').onclick = function (e)
    {
      if (e.target.classList.contains('closable')) this.classList.add('hidden');

      var li = PP.par(e.target, 'li');

      if (li)
      {
        // pick this subject
        document.querySelector('#composer .head .cap').value = li.dataset.subj;
        this.classList.add('hidden');
      }

      e.stopPropagation()
    }
  },

  show: function ()
  {
    var i, html = '', subj = document.querySelector('#composer .head .cap').value,
        sp = document.getElementById('sp-modal'),
        ul = sp.querySelector('ul');

    for (i in MS.subjects)
    {
      html += '<li data-subj="' + MS.subjects[i] + '"><div class="mark' + (MS.subjects[i] == subj ? ' current' : '') + '"></div><div>' + MS.subjects[i] + '</div></li>';
    }

    ul.innerHTML = html;

    sp.classList.remove('hidden')
  }
};

SP.init();
