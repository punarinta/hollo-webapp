class MessageBubble extends Component
{
  constructor()
  {
    super();
    this.state.showName = false;
  }

  componentWillMount()
  {
    this.state.message = this.props.message;
  }

  componentWillReceiveProps(nextProps)
  {
    this.setState({message: nextProps.message});
  }

  toggleName()
  {
    this.setState({showName: !this.state.showName});
  }

  clearBody (body = '')
  {
    body = body.replace(/(?:[ ]\r\n|[ ]\r|[ ]\n)/g, ' ');

    /*if (CFG._('newlines'))*/ body = body.replace(/(?:\r\n|\r|\n)/g, '<br />');
    //else body = body.replace(/(?:\r\n\r\n)/g, '</p><p>');

    // URLs
    body = body.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, m =>
    {
      return `<a target="_blank" rel="noopener noreferrer" href="${m}">${m.length > 40 ? m.substr(0, 40) + '&hellip;' : m}</a>`;
    });

    // mailto: links
    body = body.replace(/(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim, '<a target="_blank" rel="noopener noreferrer" href="mailto:$1">$1</a>');

    body = body.replace('/mailto:/g', '');
    body = body.replace(/ -- /g, ' — ');

    return h('p', null, body);
  }

  render()
  {
    let message = this.state.message,
        mine = message.from.email == ML.user.email,
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

    let msgBody = body ? h('div', {className: 'msg'}, body) : '',
        filesBody = '';

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