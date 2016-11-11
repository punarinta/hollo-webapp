class MessagesPage extends Component
{
  constructor()
  {
    super();
    this.pageStart = 0;
    this.pageLength = 20;
    this.subjectFilter = '';
    this.canLoadMore = 0;
    this.chat = null;
    this.scrollTop = 0;

    this.state.h = 64;
    this.state.canSend = 0;
    this.state.compFocus = 0;
    this.state.messages = [];
    this.state.files = [];
    this.state.currentSubject = '';
    this.state.currentComposed = '';
    this.state.menuModalShown = 0;
  }

  componentDidMount()
  {
    this.scrollRef = this.scroll.bind(this);
    this.tryBlurringRef = this.tryBlurring.bind(this);
    this.base.querySelector('ul').addEventListener('scroll', this.scrollRef);
    this.base.addEventListener('click', this.tryBlurringRef);
    this.callFind();
  }

  componentWillReceiveProps(nextProps)
  {
    this.props.data.chatId = nextProps.data.chatId;
    this.callFind();
  }

  componentWillUnmount()
  {
    this.base.querySelector('ul').removeEventListener('scroll', this.scrollRef);
    this.base.removeEventListener('click', this.tryBlurringRef);
  }

  callFind(shouldAdd = 0)
  {
    ML.api('message', 'findByChatId', {chatId: this.props.data.chatId, pageStart: this.pageStart, pageLength: this.pageLength}, (data) =>
    {
      this.canLoadMore = (data.messages.length == this.pageLength);
      this.chat = data.chat;
      this.chat.read = 1;

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
    });
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

    if (h != this.state.h)
    {
      state.h = h;
    }

    this.setState(state)
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

  filterMessages(filter)
  {
    console.log(filter)
    this.setState({menuModalShown: 0})
  }

  reposition(mode = 0)
  {
    // modes: 0 - keep ul's scrollTop, 1 - scroll down
    if (this.state.messages.length) setTimeout( () =>
    {
      if (mode == 0)
      {
        this.base.querySelector('ul').scrollTop = this.scrollTop;
      }
      if (mode == 1)
      {
        this.base.querySelector('message-bubble:last-child').scrollIntoView();
        this.scrollTop = this.base.querySelector('ul').scrollTop;
      }
    }, 50);
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

  addUser()
  {
    // ML.emit('custombox', {className: 'users-modal', children})
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
  }

  unreadChat()
  {
    this.chat.read = !this.chat.read;
    ML.api('chat', 'update', {id: this.chat.id, read: this.chat.read}, () => this.setState({menuModalShown: 0}));
  }

  renameChat()
  {
    this.setState({menuModalShown: 0});
    ML.emit('messagebox', {type: 1, html: 'Enter new name:', input: this.chat.name, cb: (code, text) =>
    {
      if (code)
      {
        this.chat.name = text;
        ML.api('chat', 'update', { id: this.chat.id, name: text }, () => this.render());
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
        ML.api('chat', 'leave', {id: this.chat.id}, () =>
        {
          ML.go('chats');
        });
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
    this.setState({files: [], messages, compFocus: 0, currentComposed: ''});
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
        menuModal = h('menu-modal', {style: {display: 'none'}}),
        uploadedFiles = null,
        name = this.chat ? ML.xname(this.chat)[0] : '',
        composerHeight = this.state.compFocus ? this.state.h + 40 : this.state.h,
        sendHeight = this.state.h;

    for (let i in this.state.messages)
    {
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
        let u = this.chat.users[i];
        users.push(h('li', null,
          h(Avatar, {user: u}),
          h('div', null,
            h('div', {className: 'name'},
              this.chat.users[i].name
            ),
            h('div', {className: 'email'},
              this.chat.users[i].email
            )
          ),
          this.chat.users.length > 1 ? h(BarIcon, {img: 'color/close', onclick: () => this.removeUser(this.chat.users[i]) }) : ''
        ))
      }

      menuModal = h('menu-modal', {className: 'menu-users'},
        h('ul', null,
          users
        ),
        h('bar', null,
          h('button', {onclick: () => this.setState({menuModalShown: 0})}, 'OK'),
          h('button', {onclick: this.addUser.bind(this) }, 'Add more')
        )
      )
    }

    if (this.state.menuModalShown == 2)
    {
      let subjectLines = [], subjects = this.getUniqueSubjects();

      for (let i in subjects)
      {
        subjectLines.push(h('li', {onclick: () => this.filterMessages(subjects[i])}, subjects[i]))
      }

      menuModal = h('menu-modal', {className: 'menu-subjects'},
        h('ul', null,
          subjectLines
        )
      )
    }

    if (this.state.menuModalShown == 3)
    {
      let filePlates = [];

      for (let i in this.state.messages)
      {
        let m = this.state.messages[i];
        if (m.files) for (let j in m.files)
        {
          filePlates.push(h('li', null,
            h(FilePlate, {file: m.files[j], size: '47vw'}),
            h(BarIcon, {img: 'color/download', onclick: () => window.open(`https://${CFG.apiRoot}/api/file?method=download&messageId=${m.id}&offset=${j}`) })
          ))
        }
      }

      menuModal = h('menu-modal', {className: 'menu-files'},
        filePlates.length ? h('ul', null, filePlates) : h('div', null, 'No files in this chat')
      )
    }

    if (this.state.menuModalShown == 4)
    {
      menuModal = h('menu-modal', {className: 'menu-more'},
        h('ul', null,
          h('li', {onclick: this.muteChat.bind(this)}, this.chat.muted ? 'Unmute' : 'Mute'),
          h('li', {onclick: this.unreadChat.bind(this)}, `Mark as ${this.chat.read ? 'un' : ''}read`),
          h('li', {onclick: this.renameChat.bind(this)}, 'Rename chat'),
          h('li', {onclick: this.leaveChat.bind(this)}, 'Leave chat')
        )
      )
    }

    this.reposition();

    return (

      h('messages-page', null,
        menuModal,
        h('snackbar', null,
          h(BarIcon, {img: 'color/arrow-back', onclick: () => ML.go('chats')}),
          h('div', {className: 'name' + (this.state.menuModalShown == 1 ? ' toggled' : ''), onclick: () => this.toggleMenu(1) }, name),
          h(BarIcon, {className: this.state.menuModalShown == 2 ? 'toggled' : '', img: 'color/subjs', width: 40, height: 40, onclick: () => this.toggleMenu(2) }),
          h(BarIcon, {className: this.state.menuModalShown == 3 ? 'toggled' : '', img: 'color/clip', width: 40, height: 40, onclick: () => this.toggleMenu(3) }),
          h(BarIcon, {className: this.state.menuModalShown == 4 ? 'toggled' : '', img: 'color/more-vert', width: 40, height: 40, onclick: () => this.toggleMenu(4) })
        ),
        h('ul', {style: {bottom: composerHeight + 'px'}},
          messages
        ),
        h('composer', {style: {height: composerHeight + 'px'}},
          this.state.compFocus ? h('bar', null,
            h(BarIcon, {img: 'color/subj', width: 40, height: 40, onclick: this.showSubjects.bind(this)}),
            h('input', {className: 'subj', type: 'text', value: this.state.currentSubject, onkeyup: this.inputSubject.bind(this)}),
            h(BarIcon, {img: 'color/updown', width: 40, height: 40, onclick: this.showSubjects.bind(this)}),
            h(BarIcon, {img: 'color/clip', width: 40, height: 40}),
            h('input', {className: 'uploader', type: 'file', multiple: 'multiple', onchange: this.uploadFiles.bind(this)})
          ) : '',
          h('textarea',
          {
            rows: 1,
            placeholder: 'Write a new hollo...',
            onkeyup: this.composerTextChanged.bind(this),
            onfocus: (e) => {this.setState({compFocus: 1}); setTimeout(() => e.target.focus(), 50)},
            value: this.state.currentComposed
          }),
          this.state.canSend ? h(BarIcon, {fullHeight: 1, width: 40, img: 'color/send', height: sendHeight, onclick: this.send.bind(this) }) : '',
          uploadedFiles
        )
      )
    );
  }
}