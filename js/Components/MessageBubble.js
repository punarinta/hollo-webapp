class MessageBubble extends Component
{
  constructor()
  {
    super();
    this.state.showName = false;
  }

  componentWillMount()
  {
    this.f = document.createElement('iframe');
    this.f.src = 'about:blank';
    this.tryHtml(this.props)
  }

  componentDidUpdate()
  {
    if (this.props.html && this.state.htmlForm)
    {
      this.base.querySelector('.white').innerHTML = '';
      this.base.querySelector('.white').appendChild(this.f);
      this.f.contentWindow.document.open('text/html', 'replace');
      this.f.contentWindow.document.write(this.state.htmlForm);
      this.f.contentWindow.document.close();
    }
    else
    {
      let frame = this.base.querySelector('iframe');
      if (frame) frame.parentNode.removeChild(frame)
    }
  }

  componentWillReceiveProps(props)
  {
    this.tryHtml(props)
  }

  toggleName()
  {
    this.setState({showName: !this.state.showName});
  }

  clearBody(body = '', type = '')
  {
    body = body.replace(/(?:[ ]\r\n|[ ]\r|[ ]\n)/g, ' ');

    body = body.replace('/mailto:/g', '');
    body = body.replace(/ -- /g, ' — ');

    if (type != 'text/html')
    {
      // URLs
      body = body.replace(/(<*\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]>*)/ig, m =>
      {
        let s = m.replace(/\/$/, '').split('//');
        s = (s.length ? s[1] : s[0]).split('/');
        return `<a target="_system" rel="noopener noreferrer" href="${m}">${s.length ? (s[0] + '&hellip;') : s[0]}</a>`;
      });

      // mailto: links
      body = body.replace(/(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim, m =>
      {
        return `<a target="_system" rel="noopener noreferrer" href="mailto:${m}">${m.replace('@', ' @ ')}</a> `;
      });

      body = body.replace(/(?:\r\n|\r\r|\n\n)/g, '</p><p>');
      body = body.replace(/(?:[!\.\?:]+[ ]*[\r\n]+)/g, m =>
      {
        return m.trim() + '<br>';
      });

      body = body.replace(/\*(\w+)\*/gi, m =>
      {
        return '<span style="font-weight: bold">' + m.replace(/\*/g,'') + '</span>'
      });
    }

    body = body.replace(/\[sys:fwd\]/g, '<div class="fwd">' + _('HINT_FORWARDED') + '</div>');

    return h(MessageBody, {html: `<p>${body}</p>`, onclick: this.messageClicked.bind(this)});
  }

  previewFile(file, offset)
  {
    if (file.type.match('image.*'))
    {
      ML.emit('demobox', {messageId: this.props.message.id, offset, file})
    }
  }

  forwardTo(chat)
  {
    let message = this.props.message;

    // 'fromChatId' ID may be 0, then notes are assumed
    ML.api('message', 'forward', {id: message.id, fromChatId: this.props.chatId, toChatId: chat.id, body: message.body}, () =>
    {
      if (message.subj && message.subj.length) message.subj = 'FWD: ' + message.subj;
      else message.subj = 'FWD from chat ' + ML.xname(chat)[0];

      message.ts = Math.round(Date.now() / 1000);
      // message.body = '[sys:fwd]';

      chat.messages.push(message);
      $.C.set(null, chat.id, chat);
      ML.go('chat/' + chat.id);
    });
  }

  forwardClicked()
  {
    ML.emit('userpicker', { chatMode: 1, onselect: this.forwardTo.bind(this) });
  }

  showOriginalClicked(tryHtml)
  {
    let message = this.props.message;
    ML.emit('busybox', 1);
    ML.api('message', 'showOriginal', {id: message.id, tryHtml}, data =>
    {
      if (!data)
      {
        ML.emit('messagebox', {html: _('ERR_NO_ORIG')});
        return
      }

      // display this message in a dedicated message viewer

      ML.emit('custombox', {className: 'message-viewer'});

      setTimeout(() =>
      {
        let f = document.createElement('iframe');
        f.src = 'about:blank';
        document.querySelector('.message-viewer>div').appendChild(f);

        f.contentWindow.document.open('text/html', 'replace');
        f.contentWindow.document.write('<!DOCTYPE html>' + data.content); // <style>body{margin:0}</style>
        f.contentWindow.document.close();

        ML.emit('busybox');
      }, 500)
    });
  }

  messageClicked(e)
  {
    if (e.target.nodeName != 'A')
    {
      let list = this.props.chatId ?
      [
        h('li', { onclick: this.forwardClicked.bind(this) }, _('MSG_FORWARD')),
        h('li', { onclick: () => this.showOriginalClicked(0) }, _('MSG_SHOW_ORIG')),
        h('li', { onclick: () => this.showOriginalClicked(1) }, _('MSG_SHOW_HTML'))
      ] :
      [
        h('li', { onclick: () =>
        {
          ML.emit('messagebox', {type: 1, text: this.props.message.body, cb: (code, body) =>
          {
            if (code) this.updateNote(body);
          }});
        }}, _('MSG_EDIT')),
        h('li', { onclick: this.forwardClicked.bind(this) }, _('MSG_FORWARD')),
      ];

      // display context menu
      let children =
      [
        h('ul', null, list),
      ];

      ML.emit('custombox', {className: 'context-menu-message', children})
    }
  }

  tryHtml(props)
  {
    let message = props.message;
    if (!message || !props.html)
    {
      this.setState({htmlForm: 0});
      return;
    }
    if (message.id == this.htmlId)
    {
      return;
    }

    this.htmlId = message.id;

    ML.api('message', 'showOriginal', {id: message.id, tryHtml: 1}, data =>
    {
      this.setState({htmlForm: data ? ('<!DOCTYPE html><link rel="stylesheet" type="text/css" href="https://app.hollo.email/css/external.css">' + data.content) : 0})
    });
  }

  updateNote(body)
  {
    let notes = JSON.parse(localStorage.getItem('my-notes'));

    for (let i in notes) if (notes[i].ts == this.props.message.ts)
    {
      if (!body || !body.length) notes.splice(i, 1);
      else notes[i].body = body;
      break;
    }
    localStorage.setItem('my-notes', JSON.stringify(notes));
    ML.emit('chat:update');
  }

  render(props)
  {
    console.log(this.state.htmlForm)

    let message = props.message,
        mine = message.from ? message.from.email == props.user.email : 0,
        subject = message.subj,
        body = message.body;

    let virtualChat = {users:[message.from], read:1};

    if (body !== null && typeof body === 'object')
    {
      let w = body.widget;

      // for now we only support calendars
      subject = w.title;
      for (let i in w.att)
      {
        if (w.att[i][0] != w.org[0])
        {
          let name = w.att[i][1].length ? w.att[i][1] : w.att[i][0];
          if (w.att[i][2] == 'ACCEPTED')
          {
            subject = _('CAL_ACCEPT', [name]);
            break;
          }
          else if (w.att[i][2] == 'TENTATIVE')
          {
            subject = _('CAL_TENT', [name]);
            break;
          }
        }
      }

      body = h(InvitationWidget, {data: w})
    }
    else
    {
      body = this.clearBody(body, message.type)
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

    let messageStatus = 2;
    for (let i in props.users) if (message.from)
    {
      if (props.users.length == 1 && message.from.id != props.user.id)
      {
        messageStatus = 0;
        break;
      }
      if (props.users[i].id != message.from.id)
      {
        if (props.users[i].read || (props.users[i].trk && props.users[i].trk > message.ts))
        {
          messageStatus = 3;
          break;
        }
      }
    }

    let className = mine ? 'mine' : 'yours';
    if (this.state.htmlForm) className += ' html-mode';

    let icons = null;
    if (props.chatId)
    {
      icons = h(Avatar, {chat: virtualChat, size: '32px', onclick: this.toggleName.bind(this)});
    }
    else
    {
      icons =
      [
        h('round', { onclick: () => this.updateNote() }, '✔️️')
      ];

      messageStatus = 0;
    }

    return (

      h('message-bubble', {className},
        h('div', null,
          h('div', {className: 'white'},
            subject.length ? h('div', {className: 'cap', onclick: () => { if (props.captionClicked) props.captionClicked(subject) }},
              subject
            ) : '',
            this.state.htmlForm ? '' : msgBody,
            filesBody
          ),
          h('div', {className: 'foot'},
            icons,
            h('div', {className: 'info'},
              h('span', {className: 'status s' + messageStatus}),
              this.state.showName ? h('span', {className: 'name'}, ML.xname(virtualChat)[0]) : h('span', {className: 'ts'}, ML.ts(message.ts))
            )
          )
        )
      )
    );
  }
}