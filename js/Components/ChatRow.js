class ChatRow extends Component
{
  componentWillMount()
  {
    this.swipe = 0;
    this.action = 0;
    this.blockSwipe = 0;
    this.state.chat = this.props.chat;
  }

  componentWillReceiveProps(nextProps)
  {
    this.setState({chat: nextProps.chat});
  }

  touchStart(e)
  {
    let t = e.changedTouches[0];
    this.startX = t.pageX;
    this.startY = t.pageY;
    this.item = this.base.querySelector('.real');
    this.shadow = this.base.querySelector('.shadow');
    this.item.style.willChange = 'transform';
  }

  touchMove(e)
  {
    if (!this.props.canSwipe)
    {
      return;
    }

    let t = e.changedTouches[0], distX = t.pageX - this.startX;

    if (this.swipe)
    {
      e.preventDefault();
      let threshold = this.props.vw * .3;
      this.item.style.transform = `translateX(${distX}px)`;

      if (distX > threshold && this.action != 1)
      {
        this.action = 1;
        this.setState({mode: 1});
      }
      else if (Math.abs(distX) < threshold && this.action)
      {
        this.action = 0;
        this.setState({mode: 0});
      }
      else if (distX < -threshold && this.action != -1)
      {
        this.action = -1;
        this.setState({mode: -1});
      }
      e.stopPropagation();
    }
    else
    {
      let distY = t.pageY - this.startY;

      if (Math.abs(distY) > 16)
      {
        this.blockSwipe = 1;
      }
      else if (Math.abs(distX) > 32 && !this.blockSwipe)
      {
        this.swipe = 1;
        this.shadow.style.display = 'block';
        this.item.style.position = 'absolute';
        this.shadow.style.opacity = 1;
      }
    }
  }

  touchEnd()
  {
    this.blockSwipe = 0;

    if (this.swipe)
    {
      this.swipe = 0;

      // animate back
      setTimeout( () =>
      {
        this.item.classList.remove('travel');
        this.item.style.position = 'static';
        this.shadow.style.display = 'none';
        this.shadow.style.opacity = 0;
        this.item.style.transform = 'translateX(0)';
      }, 400);

      this.item.classList.add('travel');

      let chat = this.state.chat;

      switch (this.action)
      {
        case 1:
          chat.muted = !chat.muted - 0;

          ML.api('chat', 'update', {id: chat.id, muted: chat.muted});
          setTimeout( () =>
          {
            C.set(null, chat.id, chat);
          }, 800);

          this.item.style.transform = `translateX(${this.props.vw}px)`;
          mixpanel.track('Chat - swipe muting');
          break;

        case -1:
          chat.read = !chat.read - 0;

          ML.api('chat', 'update', {id: chat.id, read: chat.read});
          setTimeout( () =>
          {
            C.set(null, chat.id, chat);
          }, 400);

          this.item.style.transform = `translateX(-${this.props.vw}px)`;
          mixpanel.track('Chat - swipe reading');
          break;

        default:
          this.item.style.transform = 'translateX(0)';
      }
    }
  }

  render()
  {
    let chat = this.state.chat,
        email = chat.users[0].email,
        lastSubj = '', lastMsg = '';

    if (chat.messages)
    {
      lastMsg = chat.messages[0].body || '';
      lastSubj = chat.messages[0].subj || '';
    }

    if (lastMsg !== null && typeof lastMsg === 'object')
    {
      let w = lastMsg.widget, subject = w.title;

      for (let i in w.att)
      {
        if (w.att[i][0] != w.org[0])
        {
          let name = w.att[i][1].length ? w.att[i][1] : w.att[i][0];
          if (w.att[i][2] == 'ACCEPTED')
          {
            if (this.props.user.email == w.att[i][0]) subject = '✔ ️you accepted this invite';
            else subject = '✔ ️' + name + ' accepted this invite';
            break;
          }
          else if (w.att[i][2] == 'TENTATIVE')
          {
            if (this.props.user.email == w.att[i][0]) subject = '✔ ️you accepted this invite';
            else subject = '❓ ' + name + ' said "maybe" to this invite';
            break;
          }
        }
      }

      // for now we only support calendar invites
      lastMsg = '📅 ' + subject;
    }
    else
    {
      lastMsg = lastMsg.replace(/\[sys:fwd\]/g, ' ➡️ ' + lastSubj).replace(/(<([^>]+)>)/ig, '').substring(0, 60).trim();
    }

    let d = document.createElement('div');
    d.innerHTML = lastMsg;
    lastMsg = d.textContent.trim();

    return (

      h('chat-row', {
          ontouchstart: this.touchStart.bind(this),
          ontouchmove: this.touchMove.bind(this),
          ontouchend: this.touchEnd.bind(this),
          onclick: () => this.props.onclick(this.state.chat)
        },
        h('div', {className: 'real'},
          h(Avatar, {chat}),
          h('div', {className: 'info'},
            h('div', {className: 'name'},
              ML.xname(chat)[0]
            ),
            h('div', {className: 'email'},
              lastMsg || '—'
            )
          )
        ),
        h('div', {className: 'shadow'},
          h('div', {style: {opacity: (this.state.mode != -1) - 0}},
            `${chat.muted ? 'un' : ''}mute`
          ),
          h('div', {style: {opacity: (this.state.mode != 1) - 0}},
            'mark',
            h('br'),
            `as ${chat.read ? 'un' : ''}read`
          )
        )
      )
    );
  }
}