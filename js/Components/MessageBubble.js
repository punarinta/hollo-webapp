class MessageBubble extends Component
{
  constructor()
  {
    super();
    this.state.showName = false;
    this.canUpdate = true;
  }

  componentWillMount()
  {
    this.state.message = this.props.message;
  }

  componentWillReceiveProps(nextProps)
  {
    if (JSON.stringify(this.props) != JSON.stringify(nextProps))
    {
      this.canUpdate = true;
    }
    this.setState({message: nextProps.message});
  }

  toggleName()
  {
    this.canUpdate = true;
    this.setState({showName: !this.state.showName});
  }

  clearBody(body = '')
  {
    body = body.replace(/(?:[ ]\r\n|[ ]\r|[ ]\n)/g, ' ');

    body = body.replace('/mailto:/g', '');
    body = body.replace(/ -- /g, ' — ');

    // URLs
    body = body.replace(/(<*\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]>*)/ig, m =>
    {
      // check YouTube
      let match = m.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
      if (match && match[2].length == 11)
      {
        return `<iframe src="//www.youtube.com/embed/${match[2]}" frameborder="0" allowfullscreen></iframe>`;
      }

      let s = m.replace(/\/$/, '').split('//');
      s = (s.length ? s[1] : s[0]).split('/');
      return `<a target="_blank" rel="noopener noreferrer" href="${m}">${s.length ? (s[0] + '&hellip;') : s[0]}</a>`;
    });

    // mailto: links
    body = body.replace(/(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim, m =>
    {
      return `<a target="_blank" rel="noopener noreferrer" href="mailto:${m}">${m.replace('@', ' @ ')}</a> `;
    });

    body = body.replace(/(?:\r\n|\r\r|\n\n)/g, '</p><p>');

    body = body.replace(/\[sys:fwd\]/g, '<div class="fwd">Forwarded message</div>');

    return h(MessageBody, {html: `<p>${body}</p>`, onclick: this.messageClicked.bind(this)});
  }

  previewFile(file, offset)
  {
    if (file.type.match('image.*'))
    {
      ML.emit('demobox', {messageId: this.state.message.id, offset, file})
    }
  }

  messageClicked(e)
  {
    if (e.target.classList.contains('fwd'))
    {
      let message = this.state.message;
      ML.api('message', 'showOriginal', {id: message.id}, data =>
      {
        message.body = data;
        this.canUpdate = true;
        this.setState({message});
      });
    }
  }

  shouldComponentUpdate()
  {
    return this.canUpdate;
  }

  render()
  {
    this.canUpdate = false;

    let message = this.state.message,
        mine = message.from.email == this.props.user.email,
        subject = message.subject,
        body = message.body;

    let virtualChat = {users:[message.from], read:1};

    if (ML.isJson(body) && body && body.charAt(0) == '{')
    {
      let w = JSON.parse(body).widget;

      // for now we only support calendars
      subject = w.title;
      body = h(InvitationWidget, {data: w})
    }
    else
    {
      body = this.clearBody(body)
    }

    let filesBody = '',
        msgBody = body ? h('div', {className: 'msg'}, body) : '';

    if (message.files)
    {
      let files = [];

      for (let i in message.files)
      {
        files.push(h(FilePlate, {file: message.files[i], offset: i, onclick: this.previewFile.bind(this)}));
      }

      filesBody = h('div', {className: 'files'},
        files
      )
    }

    return (

      h('message-bubble', {className: mine ? 'mine' : 'yours'},
        h('div', null,
          h('div', {className: 'white'},
            h('div', {className: 'cap'},
              subject
            ),
            msgBody,
            filesBody
          ),
          h('div', {className: 'foot'},
            h(Avatar, {chat: virtualChat, size: '32px', onclick: this.toggleName.bind(this)}),
            h('div', {className: 'info'},
              h('span', {className: 'status s2'}),
              this.state.showName ? h('span', {className: 'name'}, ML.xname(virtualChat)[0]) : h('span', {className: 'ts'}, ML.ts(message.ts))
            )
          )
        )
      )
    );
  }
}