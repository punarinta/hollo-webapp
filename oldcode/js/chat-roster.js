var CR =
{
  modal: document.getElementById('roster-modal'),

  addUser (user)
  {
    let xname = CO.xname({users:[user]}), name = xname[0], nc = xname[1];

    return (
    `<li data-email="${user.email}">
      <div class="ava">
        <div class="img" style="background:${ML.colorHash(user.email + '')}">${nc}</div>
      </div>
      <div class="hujava">
        <div class="name">${name}</div>
        <div class="email">${user.email}</div>
      </div>
      <div class="delete"></div>
    </li>`);
  },

  init (users)
  {
    let i, html = '',
        roster = document.getElementById('snackbar-menu-roster'),
        ul = roster.querySelector('ul');

    for (i in users) html += this.addUser(users[i]);

    ul.innerHTML = html;

    // connect delete buttons
    ul.onclick = function (e)
    {
      if (!e.target.classList.contains('delete')) return;

      // kill this line
      let line = PP.par(e.target, 'li');
      line.parentNode.removeChild(line);
    };

    CR.modal.querySelector('input').onkeyup = function ()
    {
      let filter = this.value;
      CR.modal.querySelector('.clear').classList.toggle('hidden', !filter.length);
      CR.listSuggestions(filter)
    };

    CR.modal.querySelector('.clear').onclick = function ()
    {
      // do no focus input field back
      CR.modal.querySelector('input').value = '';
      CR.modal.querySelector('.clear').classList.add('hidden');
      CR.listSuggestions()
    };

    CR.modal.querySelector('ul').onclick = function (e)
    {
      if (e.target.tagName == 'LI')
      {
        ul.innerHTML += CR.addUser({name: e.target.dataset.name, email: e.target.dataset.email});
        CR.modal.classList.add('hidden')
      }
    };

    roster.querySelector('.btn.add').onclick = function ()
    {
      CR.modal.classList.remove('hidden');
      CR.modal.querySelector('input').focus();
      CR.listSuggestions();
    };

    CR.modal.querySelector('.close').onclick = function ()
    {
      CR.modal.classList.add('hidden')
    };

    roster.querySelector('.btn.ok').onclick = function ()
    {
      let chatEmails = [];
      Array.prototype.forEach.call(ul.querySelectorAll('li'), function (el)
      {
        chatEmails.push(el.dataset.email);
      });

      // create a chat with current users and added users (or just emails) and switch to that chat
      ML.api('chat', 'add', {emails: chatEmails}, data =>
      {
        ML.go('chat/' + data.id);
      });
    };
  },

  listSuggestions (filter)
  {
    let params = {pageStart: 0, pageLength: 25};
    if (filter && filter.length) params.filters = [{mode:'email', value:filter}];

    ML.api('contact', 'find', params, data =>
    {
      let i, html = '', ul = CR.modal.querySelector('ul');

      if (data.length)
      {
        for (i in data)
        {
          html += `<li data-email="${data[i].email}" data-name="${data[i].name || ''}">${data[i].email}</li>`;
        }
      }
      else if (ML.isEmail(filter))
      {
        html = `<li data-email="${filter}" data-name="${filter}">${filter}</li>`;
      }

      ul.innerHTML = html;
    });
  }
};

CR.init();
