class MessagesPage extends Component
{
  constructor()
  {
    super();
    this.scrollTop = 0;
    this.state.h = 64;
    this.state.canSend = 0;
    this.state.compFocus = 0;
    this.state.messages = [];
    this.state.files = [];
    this.state.subjectFilter = 0;
    this.state.currentSubject = '';
    this.state.currentComposed = '';
    this.state.menuModalShown = 0;
    this.state.emojis = [];
  }

  componentDidMount()
  {
    this.tryBlurringRef = this.tryBlurring.bind(this);
    this.chatUpdateReference = this.chatUpdate.bind(this);
    this.chatAttachReference = this.chatAttach.bind(this);
    this.base.addEventListener('click', this.tryBlurringRef);
    window.addEventListener('hollo:chat:update', this.chatUpdateReference);
    window.addEventListener('hollo:chat:attach', this.chatAttachReference);
    ML.load('modules/emojis');
  }

  componentWillReceiveProps(nextProps)
  {
    this.setState({menuModalShown: 0});
    this.chatId = nextProps.data.chatId;

    if (this.chatId != 'me')
    {
      let chat = $.C.get(this.chatId);
      if (chat && !chat.read)
      {
        chat.read = 1;
        ML.api('chat', 'update', {id: chat.id, read: 1});
        $.C.set(null, this.chatId, chat);
      }
    }
    this.chatUpdate(nextProps);
  }

  componentWillUnmount()
  {
    this.base.removeEventListener('click', this.tryBlurringRef);
    window.removeEventListener('hollo:chat:update', this.chatUpdateReference);
    window.removeEventListener('hollo:chat:attach', this.chatAttachReference);
  }

  chatUpdate(props)
  {
    if (this.chatId)
    {
      let messages = [], currentSubject;

      if (this.chatId == 'me')
      {
        this.chat = { id: 0, name: _('CAP_MY_NOTES'), read: 1, users: [], muted: 0 };

        messages = props.notes || [];
        currentSubject = messages.length ? messages[messages.length - 1].subj : '';
      }
      else
      {
        this.chat = $.C.get(this.chatId);
        messages = this.chat.messages || [];
        currentSubject = messages.length ? messages[0].subj : _('CAP_NEW_SUBJ');
      }

      this.setState({messages, currentSubject});
      this.reposition(1)
    }
  }

  chatAttach(e)
  {
    let files = this.state.files;
    files.push(e.payload);
    console.log('Attach:', e.payload);
    this.setState({files});
  }

  composerTextChanged(e)
  {
    if (e.keyCode == 13 && e.ctrlKey) { this.send(); return }

    // this 4-line magic below needs to be in this damn order!
    let t = e.target;
    t.style.height = 'auto';
    let h = t.scrollHeight + 3;
    t.style.height = h + 'px';

    h = Math.min(parseInt(h, 10), window.innerHeight * .3);
    let state = {canSend: !!t.value.trim().length, currentComposed: t.value};

    if (h != this.state.h) state.h = h;

    // process emojis
    if (/[^a-zA-Z0-9-_]/.test(t.value.slice(-1)) && e.keyCode > 31)
    {
      let key = t.value.trim().split(' ').slice(-1)[0].toLowerCase().replace(/[_\W]+/g, '');

      if (typeof EMJ[key] != 'undefined')
      {
        let emojis = this.state.emojis;
        emojis.push(key);
        this.setState({emojis});

        // simply remove the top one in 5 sec
        setTimeout(() =>
        {
          let emojis = this.state.emojis;
          this.state.emojis.shift();
          this.setState({emojis});
        }, 5000)
      }
    }

    this.setState(state)
  }

  removeEmoji(key, offset)
  {
    let emojis = this.state.emojis, currentComposed = this.state.currentComposed;

    for (let i in emojis)
    {
      if (emojis[i] == key) emojis.splice(emojis.indexOf(key), 1)
    }

    if (CFG.emojisReplace)
    {
      // replace the last occurrence of a word with an emoji
      let pat = new RegExp('(\\b' + key + '\\b)(?!.*\\b\\1\\b)', 'i');
      currentComposed = currentComposed.replace(pat, EMJ[key][offset]);
    }
    else
    {
      currentComposed += EMJ[key][offset] + ' ';
    }

    this.setState({emojis, currentComposed});
    setTimeout(() => this.cmpText.focus(), 50)
  }

  tryBlurring(e)
  {
    if (!ML.par(e.target, 'composer') && this.state.compFocus)
    {
      this.setState({compFocus: 0})
    }
    if (!ML.par(e.target, 'menu-modal') && !ML.par(e.target, 'snackbar') && this.state.menuModalShown)
    {
      this.setState({menuModalShown: 0})
    }
  }

  getUniqueSubjects()
  {
    let subjects = [];

    for (let i in this.state.messages)
    {
      subjects.push(this.state.messages[i].subj)
    }

    return ML.uniques(subjects);
  }

  filterMessages(subjectFilter)
  {
    this.setState({menuModalShown: 0, subjectFilter});
    if (!subjectFilter) this.reposition(1)
  }

  reposition(mode = 0, timeOffset = 0)
  {
    // modes: 0 - keep ul's scrollTop, 1 - scroll down
    if (this.state.messages.length) setTimeout( () =>
    {
      if (mode == 0 && this.base)
      {
        this.base.querySelector('ul').scrollTop = this.scrollTop;
      }
      if (mode == 1)
      {
        let last = this.base.querySelector('message-bubble:last-child');
        if (last) last.scrollIntoView(false);
        this.scrollTop = this.base.querySelector('ul').scrollTop;
      }
    }, 50 + timeOffset);
  }

  toggleMenu(menuId = 0)
  {
    if (this.state.menuModalShown == menuId) menuId = 0;
    this.setState({menuModalShown: menuId});
  }

  showSubjects()
  {
    let subjects = this.getUniqueSubjects(), subjectRows = [];

    for (let i in subjects)
    {
      let currentSubject = subjects[i];
      subjectRows.push(h('li', {className: subjects[i] == this.state.currentSubject ? 'sel' : '', onclick: () => this.setState({currentSubject})}, currentSubject))
    }

    let children =
    [
      h('ul', null, subjectRows),
      h('button', {onclick: this.newSubject.bind(this)}, _('BTN_ADD_SUBJ'))
    ];

    ML.emit('custombox', {className: 'subjects-modal', children})
  }

  newSubject()
  {
    this.setState({currentSubject: ''});
    setTimeout(() => this.base.querySelector('input.subj').focus(), 50);
    mixpanel.track('Message - new subject');
  }

  inputSubject(e)
  {
    this.setState({currentSubject: e.target.value});
    if (e.keyCode == 13)
    {
      this.base.querySelector('composer textarea').focus()
    }
  }

  addUserStart()
  {
    ML.emit('userpicker', {onselect: this.addUser.bind(this)});
    this.setState({menuModalShown: 0})
  }

  addUser(user)
  {
    let emails = [user.email];
    for (let i in this.chat.users) emails.push(this.chat.users[i].email);

    ML.api('chat', 'add', {emails}, data =>
    {
      this.setState({menuModalShown: 0});
      ML.go('chat/' + data.id);
    });
  }

  removeUser(user)
  {
    let emails = [];

    for (let i in this.chat.users) if (this.chat.users[i].email != user.email) emails.push(this.chat.users[i].email);

    ML.api('chat', 'add', {emails}, data =>
    {
      this.setState({menuModalShown: 0});
      ML.go('chat/' + data.id);
    });
  }

  muteChat()
  {
    this.chat.muted = 1 * !this.chat.muted;
    ML.api('chat', 'update', {id: this.chat.id, muted: this.chat.muted}, () =>
    {
      this.setState({menuModalShown: 0});
      $.C.set(null, this.chat.id, this.chat);
    });
  }

  unreadChat()
  {
    this.chat.read = 1 * !this.chat.read;
    ML.api('chat', 'update', {id: this.chat.id, read: this.chat.read}, () =>
    {
      this.setState({menuModalShown: 0});
      $.C.set(null, this.chat.id, this.chat);
    });
  }

  renameChat()
  {
    this.setState({menuModalShown: 0});
    ML.emit('messagebox', {type: 1, html: _('CAP_NEW_NAME'), input: this.chat.name || '', cb: (code, name) =>
    {
      if (code)
      {
        this.chat.name = name;
        ML.api('chat', 'update', { id: this.chat.id, name });
        $.C.set(null, this.chat.id, this.chat);
      }
    }});
    mixpanel.track('Chat - rename');
  }

  leaveChat()
  {
    this.setState({menuModalShown: 0});
    ML.emit('messagebox', {type: 1, html: _('HINT_AREYOUSURE'), cb: (code) =>
    {
      if (code)
      {
        let id = this.chat.id;
        ML.api('chat', 'leave', {id}, () =>
        {
          $.C.remove(id);
          ML.go('chats')
        });
      }
    }})
  }

  clearNotes()
  {
    ML.emit('messagebox', {type: 1, html: _('HINT_AREYOUSURE'), cb: (code) =>
    {
      if (code) ML.emit('notes:update', [])
    }})
  }

  uploadFiles(e)
  {
    let i, f, files = e.target.files;

    for (i = 0; f = files[i]; i++)
    {
      let reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = ( (f) =>
      {
        if (f.size > 10485760)
        {
          ML.emit('messagebox', {html: _('ERR_BIG_FILE')});
          return null;
        }

        return (e) =>
        {
          ML.emit('chat:attach',
          {
            name: f.name,
            type: f.type,
            size: f.size,
            b64:  e.target.result // we need to store this to be able to send
          });

          mixpanel.track('Composer - file attached');
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }

    e.target.value = '';
  }

  previewFile(file)
  {
    ML.emit('demobox', {file, canDelete: 1, ondelete: this.removeFile.bind(this)})
  }

  removeFile(file)
  {
    let files = this.state.files;
    files.splice(file.i, 1);
    this.setState({files});
  }

  send()
  {
    let msgId = null, messages = this.state.messages,
        msg = this.base.querySelector('textarea').value.trim();

    if (!msg.length && !this.state.files.length)
    {
      ML.emit('messagebox', {html: 'Nothing to send'});
      return;
    }

    let m =
    {
      ts: new Date().getTime() / 1000,
      body: msg,
      subj: this.state.currentSubject
    };

    if (!this.chat.id)
    {
      let notes = this.props.notes;
      notes.unshift(m);
      notes = notes.slice(0, 12);
      ML.emit('notes:update', notes);
      this.setState({files: [], compFocus: 0, currentComposed: '', h: 64, canSend: 0});
      this.reposition(1);
      return
    }

    // try to find last message with real id
    for (let i in this.state.messages)
    {
      msgId = (this.state.messages[i].id - 0) || msgId
    }

    m.id = 0;
    m.userId = this.props.user.id;
    m.files = this.state.files;

    messages.push(m);

    this.setState({files: [], compFocus: 0, currentComposed: '', h: 64});
    this.reposition(1);

    this.chat.messages = messages;
    $.C.set(null, this.chat.id, this.chat);

    console.log('Sending:', msg, msgId, m.subj, m.files, this.chat.id);

    let statusClass = this.base.querySelector('message-bubble:last-child .status').className;
    statusClass = 'status s1';

    ML.api('message', 'send', {body: msg, messageId: msgId, subject: m.subj, files: m.files, chatId: this.chat.id}, json =>
    {
      // mark it as delivered to mail/DB
      statusClass = 'status s2';
      console.log('message/send()', json);
    });

    mixpanel.track('Composer - message sent');
  }

  render(props)
  {
    let messages = [],
        menuModal = h('div', {className: 'modal-shader', style: {display: 'none'}}),
        uploadedFiles = null,
        name = this.chat ? ML.xname(this.chat)[0] : '',
        composerHeight = this.state.compFocus ? this.state.h + 40 : this.state.h,
        sendHeight = this.state.h;

    // render in reversed order
    for (let i = this.state.messages.length - 1; i >= 0; i--)
    {
      let user = props.user,
          notes = props.notes,
          message = this.state.messages[i];

      message.from = message.userId == user.id ? user : $.U.get(message.userId);

      if (this.state.subjectFilter)
      {
        if (message.subj != this.state.subjectFilter) continue;
      }

      let chat = this.chat || {};

      messages.push(h(MessageBubble,
      {
        message,
        user,
        notes,
        users: chat.users || [],
        chatId: chat.id || 0,
        captionClicked: (subjectFilter) => this.setState({subjectFilter}),
        html: chat.muted || 0
      }))
    }

    if (this.state.files.length)
    {
      let filePlates = [];

      for (let i in this.state.files)
      {
        let file = this.state.files[i];
        file.i = i;
        filePlates.push(h(FilePlate, {file, onclick: this.previewFile.bind(this)}))
      }

      uploadedFiles = h('div', {className: 'files'}, filePlates);
      composerHeight += 80;
      sendHeight += 80;
      this.state.canSend = 1;
    }

    if (this.state.menuModalShown == 1)
    {
      let users = [];

      for (let i in this.chat.users)
      {
        let user = this.chat.users[i];
        users.push(h('li', null,
          h(Avatar, {user}),
          h('div', null,
            h('div', {className: 'name'},
              user.name
            ),
            h('div', {className: 'email'},
              ML.prettyEmail(user.email)
            )
          ),
          this.chat.users.length > 1 ? h(BarIcon, {img: 'color/cross', onclick: () => this.removeUser(user) }) : ''
        ))
      }

      menuModal = h('div', {className: 'modal-shader'},
        h('menu-modal', {className: 'menu-users'},
          h('ul', null,
            users
          ),
          h('bar', null,
            h('button', {onclick: this.addUserStart.bind(this) }, _('BTN_ADD_USERS'))
          )
        )
      )
    }

    if (this.state.menuModalShown == 2)
    {
      let subjectLines = [], subjects = this.getUniqueSubjects();

      if (subjects.length)
      {
        for (let i in subjects)
        {
          // babeli bug if 'subject' is not defined via a variable
          let subject = subjects[i];
          subjectLines.push(h('li', {onclick: () => this.filterMessages(subject)}, subject))
        }
      }
      else
      {
        subjectLines.push(h('li', null, _('HINT_NO_SUBJS')))
      }

      menuModal = h('div', {className: 'modal-shader'},
        h('menu-modal', {className: 'menu-subjects'},
          h('ul', null,
            subjectLines.reverse()
          )
        )
      )
    }

    if (this.state.menuModalShown == 3)
    {
      let filePlates = [];

      for (let i in this.state.messages)
      {
        let m = this.state.messages[i];
        if (m.files)
        {
          for (let j in m.files)
          {
            // babeli bug if vars are not defined via a variable
            let file = m.files[j], token = '';

            if ($platform == 1) token = '&token=' + ML.sessionId;

            filePlates.push(h('li', null,
              h(FilePlate, {file, size: $windowInnerWidth > 768 ? '160px' : 'calc(50vw - 30px)', full: 1}),
              h(BarIcon, {img: 'color/download', onclick: () => window.open(CFG.apiRoot + 'file?method=download&messageId=' + m.id + '&offset=' + j + token, '_system') })
            ))
          }
        }
      }

      menuModal = h('div', {className: 'modal-shader'},
        h('menu-modal', {className: 'menu-files'},
          filePlates.length ? h('ul', null, filePlates) : h('div', null, _('HINT_NO_FILES'))
        )
      )
    }

    if (this.state.menuModalShown == 4 && this.chat)
    {
      let lis = this.chat.id ?
      [
        h('li', {onclick: this.muteChat.bind(this)}, this.chat.muted ? _('CHAT_UNMUTE') : _('CHAT_MUTE') ),
        h('li', {onclick: this.unreadChat.bind(this)}, _(this.chat.read ?'CHAT_UNREAD' : 'CHAT_READ', null, {singleLine:1}) ),
        this.chat.users.length > 1 ? h('li', {onclick: this.renameChat.bind(this)}, _('CHAT_RENAME') ) : null,
        h('li', {onclick: this.leaveChat.bind(this)}, _('CHAT_LEAVE') )
      ]
      :
      [
        h('li', { onclick: this.clearNotes.bind(this) }, _('CHAT_CLEAR') ),
        h('li', { onclick: () => ML.emit('user:sync') }, _('CHAT_SYNCNOTES') )
      ];

      menuModal = h('div', {className: 'modal-shader'},
        h('menu-modal', {className: 'menu-more'},
          h('ul', null, lis)
        )
      )
    }

    let filterModal = h('filter-modal', {style: {display: this.state.subjectFilter ? 'flex' : 'none'}},
      h('div', null,
        h('div', {className: 'caption'}, _('CAP_SUBJ_FLT')),
        h('div', {className: 'filter'}, this.state.subjectFilter)
      ),
      h(BarIcon, {img: 'color/circled-cross', onclick: () => this.filterMessages(0)})
    );

    let emojiRows = [];
    for (let i in this.state.emojis)
    {
      let key = this.state.emojis[i], emojis = [];

      for (let j in EMJ[key])
      {
        emojis.push(h('emoji', {onclick: () => this.removeEmoji(key, j) }, EMJ[key][j]))
      }
      emojiRows.push(h('div', null, emojis))
    }

    let listHint = _(this.chatId ? (this.chat && !this.chat.id ? 'HINT_NO_NOTES' : 'HINT_NO_MSGS') : 'HINT_PICK_CHAT');

    if (name) document.title = name;

    let uploadButton = this.chatId == 'me' ? '' :
    [
      h(BarIcon, {img: 'color/clip', width: 40, height: 40}),
      h('input', {className: 'uploader', type: 'file', multiple: 'multiple', onchange: this.uploadFiles.bind(this)})
    ];

    return (

      h('messages-page', {style: {zIndex: props.zIndex}},
        filterModal,
        menuModal,
        h('snackbar', null,
          $windowInnerWidth > 768 ? null : h(BarIcon, {img: 'color/arrow-back', onclick: () => ML.go('chats', {muted: this.chat ? this.chat.muted : 0} ) }),
          h('div', {className: 'name' + (this.state.menuModalShown == 1 ? ' toggled' : ''), onclick: () => this.toggleMenu(1) }, name),
          h(BarIcon, {className: this.state.menuModalShown == 2 ? 'toggled' : '', img: 'color/subjs', width: 40, height: 40, onclick: () => this.toggleMenu(2) }),
          this.chatId == 'me' ? '' : h(BarIcon, {className: this.state.menuModalShown == 3 ? 'toggled' : '', img: 'color/clip', width: 40, height: 40, onclick: () => this.toggleMenu(3) }),
          h(BarIcon, {className: this.state.menuModalShown == 4 ? 'toggled' : '', img: 'color/more-vert', width: 40, height: 40, onclick: () => this.toggleMenu(4) })
        ),
        h('ul', {className: this.state.subjectFilter ? 'with-filter' : ''}, messages.length ? messages : h('li', {className: 'list-hint'}, listHint) ),
        this.chatId ? h('composer', {style: {minHeight: composerHeight + 'px', height: composerHeight + 'px'}},
          h('emojis', {style: {bottom: composerHeight + 8 + 'px'}},
            emojiRows
          ),
          this.state.compFocus ? h('bar', null,
            h(BarIcon, {img: 'color/subj', width: 40, height: 40, onclick: this.showSubjects.bind(this)}),
            h('input', {className: 'subj', type: 'text', value: this.state.currentSubject, onkeyup: this.inputSubject.bind(this), onclick: this.showSubjects.bind(this)}),
            uploadButton
          ) : '',
          h('textarea',
          {
            ref: (input) => this.cmpText = input,
            rows: 1,
            placeholder: _('CAP_WRITE_NEW'),
            onkeyup: this.composerTextChanged.bind(this),
            onfocus: (e) => { this.setState({compFocus: 1}); setTimeout(() => e.target.focus(), 50); this.reposition(1, $platform == 1 ? 200 : 50) },
            value: this.state.currentComposed
          }),
          this.state.canSend ? h(BarIcon, {className: 'btn-send', fullHeight: 1, width: 40, img: 'color/send', height: sendHeight, onclick: this.send.bind(this) }) : '',
          uploadedFiles
        ) : ''
      )
    );
  }
}