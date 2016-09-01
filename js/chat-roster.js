var CR =
{
  loaded: 0,

  init: function (users)
  {
    if (CR.loaded)
    {
      return
    }

    var html = '', roster = document.getElementById('snackbar-menu-roster'), ul = roster.querySelector('ul');

    for (var i in users)
    {
      html += '<li data-email="' + users[i].email + '"><div>' + users[i].email + '</div><div class="delete"></div></li>';
    }

    ul.innerHTML = html;

    // connect delete buttons
    ul.onclick = function (e)
    {
      if (!e.target.classList.contains('delete')) return;

      // kill this line
      var line = PP.par(e.target, 'li');
      line.parentNode.removeChild(line);
    };

    roster.querySelector('input').onkeydown = function (e)
    {
      var email = this.value;
      if (e.keyCode == 13 && ML.isEmail(email))
      {
        ul.innerHTML += '<li data-email="' + email + '"><div>' + email + '</div><div class="delete"></div></li>';
        this.value = '';
      }
    };

    roster.querySelector('.btn.ok').onclick = function ()
    {
      var chatEmails = [];
      Array.prototype.forEach.call(ul.querySelectorAll('li'), function (el)
      {
        chatEmails.push(el.dataset.email);
      });

      console.log(chatEmails);

      // create a chat with current users and added users (or just emails) and switch to that chat
      ML.api('chat', 'add', {emails: chatEmails}, function (data)
      {
        ML.go('chat/' + data.id);
      });

      // document.querySelector('#snackbar .roster.sub').dispatchEvent(new Event('click'));
    };

    CR.loaded = 1
  },

  onShow: function ()
  {
    document.querySelector('#snackbar-menu-roster input').focus();

  /*  ML.api('contact', 'find', null, function (data)
    {
      for (var i in data)
      {

      }
    });*/
  }
};
