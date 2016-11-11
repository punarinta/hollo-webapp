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

    this.state.h = 64;
    this.state.canSend = 0;
    this.state.compFocus = 0;
    this.state.messages = [];
    this.state.files = [];
    this.state.currentSubject = 'My subject';
  }

  componentDidMount()
  {
    this.scrollRef = this.scroll.bind(this);
    this.tryBlurringRef = this.tryBlurring.bind(this);
    window.addEventListener('scroll', this.scrollRef);
    this.base.addEventListener('click', this.tryBlurringRef);
    this.callFind();
  }

  componentWillUnmount()
  {
    window.removeEventListener('scroll', this.scrollRef);
    this.base.removeEventListener('click', this.tryBlurringRef);
  }

  callFind(shouldAdd = 0)
  {
    ML.api('message', 'findByChatId', {chatId: this.props.data.chatId, pageStart: this.pageStart, pageLength: this.pageLength}, (data) =>
    {
      this.canLoadMore = (data.messages.length == this.pageLength);
      this.chat = data.chat;

      data.messages = data.messages.reverse();

      if (shouldAdd)
      {
        this.pageStart += data.messages.length;
        this.setState({messages: data.messages.concat(this.state.messages)});
      }
      else
      {
        this.setState({messages: data.messages, currentSubject: data.messages[data.messages.length - 1].subject})
      }
    });
  }

  scroll()
  {
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
    this.setState({h, canSend: !!t.value.length});
  }

  tryBlurring(e)
  {
    if (!ML.par(e.target, 'composer'))
    {
      this.setState({compFocus: 0})
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

  showUsers()
  {

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
    setTimeout(() => this.base.querySelector('input.subj').focus(), 50)
  }

  inputSubject(e)
  {
    this.setState({currentSubject: e.target.value});
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
            b64:  f.type.match('image.*') ? e.target.result : null
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
    console.log('Sent!')
  }

  render()
  {
    let messages = [],
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

    return (

      h('messages-page', null,
        h('snackbar', null,
          h(BarIcon, {img: 'color/arrow-back', onclick: () => ML.go('chats')}),
          h('div', {className: 'name', onclick: this.showUsers.bind(this)}, name),
          h(BarIcon, {img: 'color/subjs', width: 40, height: 40, onclick: () => {} }),
          h(BarIcon, {img: 'color/clip', width: 40, height: 40, onclick: () => {} }),
          h(BarIcon, {img: 'color/more-vert', width: 40, height: 40, onclick: () => {} })
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
            onfocus: (e) => {this.setState({compFocus: 1}); setTimeout(() => e.target.focus(), 50)}
          }),
          this.state.canSend ? h(BarIcon, {fullHeight: 1, width: 40, img: 'color/send', height: sendHeight, onclick: this.send.bind(this) }) : '',
          uploadedFiles
        )
      )
    );
  }
}