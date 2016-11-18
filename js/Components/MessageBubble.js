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
    this.setState({showName: !this.state.showName});
  }

  clearBody(body = '', messageId = 0)
  {
    body = body.replace(/(?:[ ]\r\n|[ ]\r|[ ]\n)/g, ' ');

    body = body.replace('/mailto:/g', '');
    body = body.replace(/ -- /g, ' — ');

    // URLs
    body = body.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, m =>
    {
      return `<a target="_blank" rel="noopener noreferrer" href="${m}">${m.length > 25 ? m.substr(0, 25) + '&hellip;' : m}</a>`;
    });

    // mailto: links
    body = body.replace(/(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim, '<a target="_blank" rel="noopener noreferrer" href="mailto:$1">$1</a>');

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
      body = this.clearBody(body, message.id)
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