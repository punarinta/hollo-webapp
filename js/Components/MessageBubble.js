class MessageBubble extends Component
{
  constructor()
  {
    super();
    this.state.showName = false;
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

    ML.api('message', 'forward', {id: message.id, fromChatId: this.props.chatId, toChatId: chat.id}, () =>
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
    if (this.props.chatId && e.target.nodeName != 'A')
    {
      // display context menu
      let children =
      [
        h('ul', null,
          h('li', { onclick: this.forwardClicked.bind(this) }, _('MSG_FORWARD')),
          h('li', { onclick: () => this.showOriginalClicked(0) }, _('MSG_SHOW_ORIG')),
          h('li', { onclick: () => this.showOriginalClicked(1) }, _('MSG_SHOW_HTML'))
        ),
      ];

      ML.emit('custombox', {className: 'context-menu-message', children})
    }
  }

  tryHtml(id)
  {
    if (id == this.htmlId) return;
    this.htmlId = id;

    ML.api('message', 'showOriginal', {id, tryHtml: 1}, data =>
    {
      if (!data) return;

      let f = document.createElement('iframe');
      f.src = 'about:blank';
      this.base.querySelector('.white').innerHTML = '';
      this.base.querySelector('.white').appendChild(f);
      f.contentWindow.document.open('text/html', 'replace');
      f.contentWindow.document.write('<!DOCTYPE html>' + data.content);
      f.contentWindow.document.close();
      this.setState({htmlMode: 1})
    });
  }

  render(props)
  {
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

    if (props.html)
    {
      this.tryHtml(message.id);
      if (this.state.htmlMode) className = 'html-mode'
    }

    return (

      h('message-bubble', {className},
        h('div', null,
          h('div', {className: 'white'},
            subject.length ? h('div', {className: 'cap', onclick: () => { if (props.captionClicked) props.captionClicked(subject) }},
              subject
            ) : '',
            this.state.htmlMode ? '' : msgBody,
            filesBody
          ),
          h('div', {className: 'foot'},
            h(Avatar, {chat: virtualChat, size: '32px', onclick: this.toggleName.bind(this)}),
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