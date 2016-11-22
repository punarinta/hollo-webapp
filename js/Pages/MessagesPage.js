class MessagesPage extends Component
{
  constructor()
  {
    super();
    this.pageStart = 0;
    this.pageLength = 20;
    this.canLoadMore = 0;
    this.chat = null;
    this.scrollTop = 0;
    this.lastCallFindParams = {};

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
    this.scrollRef = this.scroll.bind(this);
    this.tryBlurringRef = this.tryBlurring.bind(this);
    this.firebaseListenerRef = this.firebaseListener.bind(this);
    this.base.querySelector('ul').addEventListener('scroll', this.scrollRef);
    this.base.addEventListener('click', this.tryBlurringRef);
    window.addEventListener('hollo:firebase', this.firebaseListenerRef);
    this.callFind();
    ML.load('modules/emojis');
  }

  componentWillReceiveProps(nextProps)
  {
    if (this.props.data.chatId != nextProps.data.chatId)
    {
      this.setState({menuModalShown: 0});
      this.props.data.chatId = nextProps.data.chatId;
    }
    this.callFind();
  }

  componentWillUnmount()
  {
    this.base.querySelector('ul').removeEventListener('scroll', this.scrollRef);
    this.base.removeEventListener('click', this.tryBlurringRef);
    window.removeEventListener('hollo:firebase', this.firebaseListenerRef);
  }

  callFind(shouldAdd = 0)
  {
    if (!this.props.data.chatId)
    {
      return
    }

    let callFindParams = {chatId: this.props.data.chatId, pageStart: this.pageStart, pageLength: this.pageLength};

    if (JSON.stringify(callFindParams) == JSON.stringify(this.lastCallFindParams))
    {
      return
    }

    ML.emit('busybox', 1);

    ML.api('message', 'findByChatId', this.lastCallFindParams = callFindParams, (data) =>
    {
      this.canLoadMore = (data.messages.length == this.pageLength);
      this.chat = data.chat;
      this.chat.read = 1;

      ML.emit('chatupdate', {chat : this.chat});

      data.messages = data.messages.reverse();

      if (shouldAdd)
      {
        // adds messages to the top
        this.pageStart += data.messages.length;
        this.setState({messages: data.messages.concat(this.state.messages)});

        // TODO: configure repositioning
      }
      else
      {
        let currentSubject = data.messages.length ? data.messages[data.messages.length - 1].subject : 'New subject';
        this.setState({messages: data.messages, currentSubject});
        this.reposition(1)
      }

      ML.emit('busybox', 0);
    });
  }

  firebaseListener(e)
  {
    if (e.payload.authId != this.props.user.id)
    {
      return
    }

    if (e.payload.cmd == 'show-chat' && !e.payload.wasTapped)
    {
      if (this.chat && e.payload.chatId == this.chat.id)
      {
        // we're inside the target chat, fetch messages
        ML.api('message', 'getLastChatMessage', {chatId: e.payload.chatId}, data =>
        {
          let messages = this.state.messages;
          messages.push(data);
          this.setState({messages});
          this.reposition(1)
        });
      }
    }
  }

  scroll(e)
  {
    this.scrollTop = e.target.scrollTop;

    if (!this.canLoadMore)
    {
      return;
    }

    let el = this.base.querySelector('message-bubble:nth-child(2)');

    if (el && el.getBoundingClientRect().top > 0)
    {
      this.canLoadMore = 0;
      this.pageStart += this.pageLength;
      this.callFind(1);

      mixpanel.track('Messages - get more');
    }
  }

  composerTextChanged(e)
  {
    let t = e.target;
    t.style.height = 'auto';
    let h = t.scrollHeight + 3;
    t.style.height = h + 'px';
    h = Math.min(parseInt(h, 10), window.innerHeight * .3);
    let state = {canSend: !!t.value.trim().length, currentComposed: t.value};

    if (h != this.state.h) state.h = h;
    if (e.keyCode == 13 && e.ctrlKey) this.send();

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
      subjects.push(this.state.messages[i].subject)
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
        this.base.querySelector('message-bubble:last-child').scrollIntoView();
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
      h('button', {onclick: this.newSubject.bind(this)}, 'New Subject')
    ];

    ML.emit('custombox', {className: 'subjects-modal', children})
  }

  newSubject()
  {
    this.setState({currentSubject: ''});
    setTimeout(() => this.base.querySelector('input.subj').focus(), 50);
  }

  inputSubject(e)
  {
    this.setState({currentSubject: e.target.value});
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
    this.chat.muted = !this.chat.muted;
    ML.api('chat', 'update', {id: this.chat.id, muted: this.chat.muted}, () => this.setState({menuModalShown: 0}));
    ML.emit('chatupdate', {chat : this.chat});
  }

  unreadChat()
  {
    this.chat.read = !this.chat.read;
    ML.api('chat', 'update', {id: this.chat.id, read: this.chat.read}, () => this.setState({menuModalShown: 0}));
    ML.emit('chatupdate', {chat : this.chat});
  }

  renameChat()
  {
    this.setState({menuModalShown: 0});
    ML.emit('messagebox', {type: 1, html: 'Enter new name:', input: this.chat.name, cb: (code, name) =>
    {
      if (code)
      {
        this.chat.name = name;
        ML.api('chat', 'update', { id: this.chat.id, name }, () => this.render());
        ML.emit('chatupdate', {chat: this.chat});
      }
    }});
  }

  leaveChat()
  {
    this.setState({menuModalShown: 0});
    ML.emit('messagebox', {type: 1, html: 'Are you sure?', cb: (code) =>
    {
      if (code)
      {
        ML.api('chat', 'leave', {id: this.chat.id}, () => ML.go('chats') );
      }
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
        return (e) =>
        {
          let files = this.state.files;

          files.push(
          {
            name: f.name,
            type: f.type,
            size: f.size,
            b64:  e.target.result // we need to store this to be able to send
          });

          this.setState({files});

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

    // try to find last message with real id
    for (let i in this.state.messages)
    {
      msgId = (this.state.messages[i].id - 0) || msgId
    }

    let m =
    {
      id: 0,
      ts: new Date().getTime() / 1000,
      body: msg,
      from: this.props.user,
      files: this.state.files,
      subject: this.state.currentSubject
     };

    messages.push(m);
    this.setState({files: [], messages, compFocus: 0, currentComposed: '', h: 64});
    this.reposition(1);

    console.log('Sending:', msg, msgId, m.subject, m.files, this.chat.id);

    let statusClass = this.base.querySelector('message-bubble:last-child .status').className;
    statusClass = 'status s1';

    ML.api('message', 'send', {body: msg, messageId: msgId, subject: m.subject, files: m.files, chatId: this.chat.id}, json =>
    {
      // mark it as delivered to mail/DB
      statusClass = 'status s2';
      console.log('send()', json);
    });

    mixpanel.track('Composer - message sent');
  }

  render()
  {
    let messages = [],
        menuModal = h('div', {className: 'modal-shader', style: {display: 'none'}}),
        uploadedFiles = null,
        name = this.chat ? ML.xname(this.chat)[0] : '',
        composerHeight = this.state.compFocus ? this.state.h + 40 : this.state.h,
        sendHeight = this.state.h;

    for (let i in this.state.messages)
    {
      if (this.state.subjectFilter)
      {
        if (this.state.messages[i].subject != this.state.subjectFilter) continue;
      }
      messages.push(h(MessageBubble, {message: this.state.messages[i], user: this.props.user}))
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
      composerHeight += 76;
      sendHeight += 76;
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
              user.email
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
            h('button', {onclick: this.addUserStart.bind(this) }, 'Add more')
          )
        )
      )
    }

    if (this.state.menuModalShown == 2)
    {
      let subjectLines = [], subjects = this.getUniqueSubjects();

      for (let i in subjects)
      {
        // babeli bug if 'subject' is not defined via a variable
        let subject = subjects[i];
        subjectLines.push(h('li', {onclick: () => this.filterMessages(subject)}, subject))
      }

      menuModal = h('div', {className: 'modal-shader'},
        h('menu-modal', {className: 'menu-subjects'},
          h('ul', null,
            subjectLines
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
            let file = m.files[j];

            filePlates.push(h('li', null,
              h(FilePlate, {file: file, size: '47vw'}),
              h(BarIcon, {img: 'color/download', onclick: () => window.open('https://' + CFG.apiRoot + '/api/file?method=download&messageId=' + m.id + '&offset=' + j) })
            ))
          }
        }
      }

      menuModal = h('div', {className: 'modal-shader'},
        h('menu-modal', {className: 'menu-files'},
          filePlates.length ? h('ul', null, filePlates) : h('div', null, 'No files in this chat')
        )
      )
    }

    if (this.state.menuModalShown == 4)
    {
      menuModal = h('div', {className: 'modal-shader'},
        h('menu-modal', {className: 'menu-more'},
          h('ul', null,
            h('li', {onclick: this.muteChat.bind(this)}, this.chat.muted ? 'Unmute' : 'Mute'),
            h('li', {onclick: this.unreadChat.bind(this)}, `Mark as ${this.chat.read ? 'un' : ''}read`),
            h('li', {onclick: this.renameChat.bind(this)}, 'Rename chat'),
            h('li', {onclick: this.leaveChat.bind(this)}, 'Leave chat')
          )
        )
      )
    }

    let filterModal = h('filter-modal', {style: {display: this.state.subjectFilter ? 'flex' : 'none'}},
      h('div', null,
        h('div', {className: 'caption'}, 'Filtering by subject'),
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

    return (

      h('messages-page', {style: {zIndex: this.props.zIndex}},
        filterModal,
        menuModal,
        h('snackbar', null,
          h(BarIcon, {img: 'color/arrow-back', onclick: () => { this.setState({menuModalShown: 0}); ML.go('chats', {muted: this.chat.muted} )} }),
          h('div', {className: 'name' + (this.state.menuModalShown == 1 ? ' toggled' : ''), onclick: () => this.toggleMenu(1) }, name),
          h(BarIcon, {className: this.state.menuModalShown == 2 ? 'toggled' : '', img: 'color/subjs', width: 40, height: 40, onclick: () => this.toggleMenu(2) }),
          h(BarIcon, {className: this.state.menuModalShown == 3 ? 'toggled' : '', img: 'color/clip', width: 40, height: 40, onclick: () => this.toggleMenu(3) }),
          h(BarIcon, {className: this.state.menuModalShown == 4 ? 'toggled' : '', img: 'color/more-vert', width: 40, height: 40, onclick: () => this.toggleMenu(4) })
        ),
        h('ul', null,
          messages
        ),
        h('composer', {style: {minHeight: composerHeight + 'px'}},
          h('emojis', {style: {bottom: composerHeight + 8 + 'px'}},
            emojiRows
          ),
          this.state.compFocus ? h('bar', null,
            h(BarIcon, {img: 'color/subj', width: 40, height: 40, onclick: this.showSubjects.bind(this)}),
            h('input', {className: 'subj', type: 'text', value: this.state.currentSubject, onkeyup: this.inputSubject.bind(this)}),
            h(BarIcon, {img: 'color/updown', width: 40, height: 40, onclick: this.showSubjects.bind(this)}),
            h(BarIcon, {img: 'color/clip', width: 40, height: 40}),
            h('input', {className: 'uploader', type: 'file', multiple: 'multiple', onchange: this.uploadFiles.bind(this)})
          ) : '',
          h('textarea',
          {
            ref: (input) => this.cmpText = input,
            rows: 1,
            placeholder: 'Write a new hollo...',
            onkeyup: this.composerTextChanged.bind(this),
            onfocus: (e) => {this.setState({compFocus: 1}); setTimeout(() => e.target.focus(), 50); this.reposition(1, 50)},
            value: this.state.currentComposed
          }),
          this.state.canSend ? h(BarIcon, {fullHeight: 1, width: 40, img: 'color/send', height: sendHeight, onclick: this.send.bind(this) }) : '',
          uploadedFiles
        )
      )
    );
  }
}