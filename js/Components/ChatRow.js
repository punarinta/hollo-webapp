class ChatRow extends Component
{
  componentWillMount()
  {
    this.swipe = 0;
    this.action = 0;
    this.blockSwipe = 0;
    this.vw = window.innerWidth > 768 ? 360 : window.innerWidth;
    this.threshold = this.vw * .3;
    this.canUpdate = true;
    this.state.chat = this.props.chat;
  }

  componentWillReceiveProps(nextProps)
  {
    if (this.state.chat.id != nextProps.chat.id)
    {
      this.canUpdate = true;
    }
    this.setState({chat: nextProps.chat});
  }

  touchStart(e)
  {
    let t = e.changedTouches[0];
    this.startX = t.pageX;
    this.startY = t.pageY;
    this.item = this.base.querySelector('div');
    this.shadow = this.base.querySelector('.shadow');
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
      this.item.style.transform = `translateX(${distX}px)`;
      e.preventDefault();

      if (distX > this.threshold) this.action = 1;
      else if (Math.abs(distX) < this.threshold) this.action = 0;
      else if (distX < -this.threshold) this.action = -1;
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

          // ML.api('chat', 'update', {id: chat.id, muted: chat.muted});

          setTimeout( () =>
          {
            this.base.parentNode.removeChild(this.base);
          }, 800);

          this.item.style.transform = `translateX(${this.vw}px)`;
          mixpanel.track('Chat - swipe muting');
          break;

        case -1:
          chat.read = !chat.read - 0;

          ML.api('chat', 'update', {id: chat.id, read: chat.read});

          setTimeout( () =>
          {
            this.canUpdate = true;
            this.setState({chat})
          }, 400);

          this.item.style.transform = `translateX(-${this.vw}px)`;
          mixpanel.track('Chat - swipe reading');
          break;

        default:
          this.item.style.transform = 'translateX(0)';
      }
    }
  }

  shouldComponentUpdate()
  {
    return this.canUpdate;
  }

  render()
  {
    this.canUpdate = false;

    let chat = this.state.chat,
        email = chat.users[0].email,
        lastMsg = chat.last.msg || '';

    if (lastMsg.charAt(0) == '{')
    {
      // for now we only support calendar invites
      lastMsg = '📅 ' + JSON.parse(lastMsg).widget.title;
    }
    else
    {
      lastMsg = lastMsg.replace(/\[sys:fwd\]/g, ' ➡️ ' + chat.last.subj).replace(/(<([^>]+)>)/ig, '').substring(0, 60).trim();
    }

    return (

      h('chat-row', {
          ontouchstart: this.touchStart.bind(this),
          ontouchmove: this.touchMove.bind(this),
          ontouchend: this.touchEnd.bind(this),
          onclick: () => this.props.onclick(this.state.chat)
        },
        h('div', null,
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
          h('div', null,
            `${chat.muted ? 'un' : ''}mute`
          ),
          h('div', {className: 'markas'},
            'mark',
            h('br'),
            `as ${chat.read ? 'un' : ''}read`
          )
        )
      )
    );
  }
}