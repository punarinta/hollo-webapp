class QuickStack extends Component
{
  constructor()
  {
    super();
    this.state.qs = [];
    this.state.count = 0;
  }

  componentDidMount()
  {
    this.countReference = this.count.bind(this);
    window.addEventListener('hollo:qs:count', this.countReference);
  }

  componentWillUnmount()
  {
    window.removeEventListener('hollo:qs:count', this.countReference);
  }

  componentWillReceiveProps(nextProps)
  {
    this.props = nextProps;
    this.count()
  }

  touchStart(e)
  {
    let t = e.changedTouches[0];
    this.swiping = 0;
    this.startX = t.pageX;
    this.startY = t.pageY;
    this.ul = this.base.querySelector('quick-stack');
    this.ul.style.willChange = 'transform';
    e.stopPropagation()
  }

  count()
  {
    let count = 0;
    for (let i in this.props.chats)
    {
      if (!this.props.chats[i].read) ++count;
    }
    this.setState({count});
  }

  show()
  {
    ML.api('message', 'buildQuickStack', {muted: this.props.muted}, qs =>
    {
      this.setState({quickStackShown: 1, qs});
    });
  }

  reply(current)
  {
    let count = this.state.count - 1;
    // TODO: update chat
    this.setState({quickStackShown: 0, count});
    ML.go('chat/' + current.chatId)
  }

  skip()
  {
    let qs = this.state.qs;
    qs.shift();
    let count = qs.length;
    this.setState({qs, count, quickStackShown: count > 0});
    this.buttonSkip.classList.remove('picked');
  }

  markRead(current)
  {
    let chat = null;
    for (let i in this.props.chats)
    {
      if (current.chatId == this.props.chats[i].id)
      {
        chat = this.props.chats[i];
        break;
      }
    }

    if (chat)
    {
      chat.read = 1;
      ML.api('chat', 'update', {id: chat.id, read: 1});
      ML.emit('chatupdate', {chat});
    }

    this.buttonRead.classList.remove('picked');

    this.skip()
  }

  touchMove(e)
  {
    let distX = e.changedTouches[0].pageX - this.startX,
        distY = e.changedTouches[0].pageY - this.startY;

    if (Math.abs(distX) > 32)
    {
      this.swiping = 1;
    }

    if (this.swiping) e.preventDefault();

    if (distX > 100)
    {
      //  this.ul.style.backgroundColor = '#F5F5DC'; // yellow
      this.buttonSkip.classList.add('picked')
    }
    else if (distX < -100)
    {
      //  this.ul.style.backgroundColor = '#F0FFF0';  // green
      this.buttonRead.classList.add('picked')
    }
    else
    {
      //  this.ul.style.backgroundColor = '#fff'; // none
      this.buttonRead.classList.remove('picked');
      this.buttonSkip.classList.remove('picked')
    }

    if (this.swiping) this.ul.style.transform = `translate(${distX}px, ${distY}px)`;
    e.stopPropagation()
  }

  touchEnd(e)
  {
    this.swiping = 0;
    this.ul.style.transform = 'translate(0,0)';
    this.ul.style.backgroundColor = '#fff';

    let distX = e.changedTouches[0].pageX - this.startX;

    if (distX > 100) this.skip();
    else if (distX < -100) this.markRead(this.state.qs[0]);
  }

  render(props)
  {
    let quickStackModal = h('div', {className: 'qs-shader', style: {display: 'none'}});

    let qsButton = h('qs-button', {style: {display: this.state.count > 0 ? 'flex' : 'none'}, onclick: this.show.bind(this) },
      h(BarIcon, {img: 'white/qs', width: 30}),
      h('div', null, this.state.count + ' unread')
    );

    if (this.state.quickStackShown && this.state.qs.length)
    {
      // always the topmost that is shown
      let fakeUser = null, current = this.state.qs[0];

      if (current.fromId == props.user.id)
      {
        fakeUser = props.user
      }
      else for (let i in props.chats)
      {
        for (let j in props.chats[i].users)
        {
          let u = props.chats[i].users[j];
          if (u.id == current.fromId)
          {
            fakeUser = u;
            break;
          }
        }
      }

      // fake a message
      let message = current;
      message.from = fakeUser;
      message.files = current.files;

      quickStackModal = h('qs-shader', {onclick: (e) => {if (e.target.nodeName.toLowerCase() == 'qs-shader') this.setState({quickStackShown: 0})} },
        h('quick-stack', { ontouchstart: this.touchStart.bind(this), ontouchmove: this.touchMove.bind(this), ontouchend: this.touchEnd.bind(this) },
          h('topbar', null,
            h(Avatar, {user: fakeUser, size: 32}),
            h('div', null, ML.xname({users:[fakeUser]})[0])
          ),
          h(MessageBubble, {message, user: this.props.user}),
          h('shadow', null, h('div'))
        ),
        h('qs-indicator', {},
          h(BarIcon, {img: 'white/qs', width: 30}),
          h('div', null, this.state.count + ' to go'),
          h(BarIcon, {svg: 'cross', fill: '#fff', type: 'polygon', width: 14, height: 14, onclick: () => this.setState({quickStackShown: 0}) })
        ),
        h('bar', null,
          h('button', {ref: (x) => this.buttonRead = x, onclick: () => this.markRead(current)}, 'Read'),
          h('button', {onclick: () => this.reply(current)}, 'Reply'),
          h('button', {ref: (x) => this.buttonSkip = x, onclick: () => this.skip() }, 'Skip')
        )
      )
    }

    return h('div', null,
      qsButton,
      quickStackModal
    );
  }
}