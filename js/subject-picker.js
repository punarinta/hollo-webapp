var SP =
{
  modal: document.getElementById('sp-modal'),
  subjInput: document.querySelector('#composer .head .cap'),

  init: function ()
  {
    SP.modal.onclick = function (e)
    {
      if (e.target.classList.contains('closable')) this.classList.add('hidden');

      var li = PP.par(e.target, 'li');

      if (li)
      {
        // pick this subject
        SP.subjInput.value = li.dataset.subj;
        this.classList.add('hidden');
      }

      e.stopPropagation()
    };

    SP.modal.querySelector('button').onclick = function ()
    {
      SP.subjInput.value = '';
      SP.subjInput.focus();
      SP.modal.classList.add('hidden')
    }
  },

  show: function ()
  {
    var i, html = '', subj = SP.subjInput.value,
        ul = SP.modal.querySelector('ul');

    for (i in MS.subjects)
    {
      html += '<li data-subj="' + MS.subjects[i] + '"><div class="mark' + (MS.subjects[i] == subj ? ' current' : '') + '"></div><div>' + MS.subjects[i] + '</div></li>';
    }

    ul.innerHTML = html;

    SP.modal.classList.remove('hidden')
  }
};

SP.init();
