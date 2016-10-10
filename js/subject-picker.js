var SP =
{
  modal: document.getElementById('sp-modal'),
  subjInput: document.querySelector('#composer .head .cap'),

  show: function ()
  {
    var i, html = '', subj = SP.subjInput.value,
        ul = SP.modal.querySelector('ul');

    for (i in MS.subjects)
    {
      html += '<li data-subj="' + MS.subjects[i] + '"><div class="mark' + (MS.subjects[i] == subj ? ' current' : '') + '"></div><div class="body">' + MS.subjects[i] + '</div></li>';
    }

    ul.innerHTML = html;

    SP.modal.classList.remove('hidden');

    mixpanel.track('Subject picker - shown');
  }
};


// === INIT ===

SP.modal.onclick = function (e)
{
  if (e.target.classList.contains('closable')) this.classList.add('hidden');

  var li = PP.par(e.target, 'li');

  if (li)
  {
    // pick this subject
    SP.subjInput.value = li.dataset.subj;
    this.classList.add('hidden');
    mixpanel.track('Subject picker - chosen');
  }

  e.stopPropagation()
};

SP.modal.querySelector('button.new').onclick = function ()
{
  mixpanel.track('Subject picker - new');
  SP.subjInput.value = '';
  SP.subjInput.focus();
  SP.modal.classList.add('hidden')
};
