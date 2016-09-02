var CR =
{
  loaded: 0,

  addUser: function (user)
  {
    var xname = CO.xname({users:[user]}), name = xname[0], nc = xname[1];

    return ('<li data-email="' + user.email + '">' +
    '<div class="ava"><div class="img" style="background:' + ML.colorHash(user.email + '') + '">' + nc + '</div></div>' +
    '<div class="hujava"><div class="name">' + name + '</div><div class="email">' + user.email + '</div></div>' +
    '<div class="delete"></div>' +
    '</li>');
  },

  init: function (users)
  {
    var html = '', roster = document.getElementById('snackbar-menu-roster'), ul = roster.querySelector('ul');

    for (var i in users) html += CR.addUser(users[i]);

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
        ul.innerHTML += CR.addUser({name:email, email:email});
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
  },

  onShow: function ()
  {
    document.querySelector('#snackbar-menu-roster input').focus();

    if (CR.loaded)
    {
      return
    }

  /*  ML.api('contact', 'find', null, function (data)
    {
      for (var i in data)
      {

      }
    });*/

    CR.loaded = 1
  }
};
