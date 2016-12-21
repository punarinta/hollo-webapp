class ChatsPage extends Component
{
  constructor()
  {
    super();
    this.emailFilter = '';
    this.filterTimer = null;
    this.state.chats = [];
    this.state.blockSwipe = 0;
    this.state.filterActive = 0;
  }

  componentDidMount()
  {
    this.chatUpdateReference = this.chatUpdate.bind(this);
    window.addEventListener('hollo:chat:update', this.chatUpdateReference);
  }

  componentWillReceiveProps(nextProps)
  {
    this.props = nextProps;
    this.chatUpdate();
  }

  componentWillUnmount()
  {
    window.removeEventListener('hollo:chat:update', this.chatUpdateReference);
  }

  chatUpdate()
  {
    this.setState({chats: C.filter(this.props.user, !!(this.props.data ? this.props.data.muted : 0), this.emailFilter.length ? this.emailFilter : null) });
    ML.emit('qs:count');
  }

  touchStart(e)
  {
    let t = e.changedTouches[0];
    this.pull = 0;
    this.swiping = 0;
    this.startX = t.pageX;
    this.startY = t.pageY;
    this.ul = this.base.querySelector('loader');
    this.ulin = this.ul.querySelector('inner-loader');
  }

  touchMove(e)
  {
    let distY = e.changedTouches[0].pageY - this.startY,
        distX = e.changedTouches[0].pageX - this.startX;

    if (Math.abs(distX) > 32)
    {
      this.swiping = 1;
    }

    if (this.pull)
    {
      if (Math.abs(distY) < 48)
      {
        this.pull = 0;
        this.ul.style.opacity = 0;
      }
      else
      {
        this.ul.style.opacity = distY/300;
        this.ulin.style.transform = `rotate(${distY/1.1}deg)`;
        this.ul.style.transform = `translateY(${distY*0.3}px)`
      }
      e.preventDefault()
    }

    if (Math.abs(distY) > 16 && !this.swiping)
    {

      if (!this.state.blockSwipe)
      {
        this.setState({blockSwipe: true});
      }

      if (distY > 80) this.pull = 2;
      else if (distY > 48) this.pull = 1;
    }
    e.stopPropagation();
  }

  touchEnd()
  {
    if (this.state.blockSwipe)
    {
      if (this.pull == 2)
      {
        this.ul.classList.add('travel');
        ML.emit('busybox', {mode: 1});
        C.sync(this.props.user, () =>
        {
          ML.emit('busybox');
        });

        setTimeout( () =>
        {
          this.ul.classList.remove('travel');
        }, 400);
      }

      this.pull = 0;
      this.ul.style.opacity = 0;
      this.ul.style.transform = 'translateY(0)';
      this.ulin.style.transform = 'rotate(0)';
      this.setState({blockSwipe: false});
    }
  }

  filterChanged(filter)
  {
    clearTimeout(this.filterTimer);

    this.filterTimer = setTimeout( () =>
    {
      if (filter == 'debug-logout') ML.go('auth/logout');
      if (this.emailFilter != filter)
      {
        this.emailFilter = filter;
        this.chatUpdate();
      }

      mixpanel.track('Sys - filter', {keyword: filter});
    }, 500);
  }

  filterFocusChanged(focus)
  {
    this.setState({filterActive: focus})
  }

  addNew()
  {
    mixpanel.track('Chat - add new');
    ML.api('chat', 'add', {emails: [this.emailFilter]}, data =>
    {
      this.setState({menuModalShown: 0});
      ML.go('chat/' + data.id);
    });
  }

  render()
  {
    let ulContents = '', muted = this.props.data ? this.props.data.muted : 0;

    if (ML.isEmail(this.emailFilter))
    {
      let email = this.emailFilter;
      ulContents = h('ul', null,
        h(ChatRow,
        {
          user: this.props.user,
          chat: {users: [{email, name: email}],
          read: 1,
          last: {msg:'Create a chat with ' + email}},
          canSwipe: 0,
          onclick: this.addNew.bind(this)
        })
      )
    }
    else if (this.state.filterActive && !this.emailFilter.length)
    {
      ulContents = h('div', {className: 'list-hint'},
        'To start a new',
        h('br'),
        'conversation type in',
        h('br'),
        'an email address.'
      )
    }
    else
    {
      let chats = [], vw = $windowInnerWidth > 768 ? 360 : $windowInnerWidth;

      // self-chat
      if (CFG.showNotes && (!this.props.data || !this.props.data.muted))
      {
        let my = JSON.parse(localStorage.getItem('messages')) || [];
        chats.push(h(ChatRow,
        {
          user: this.props.user,
          chat: {users: [this.props.user], last: {msg: my.length ? my[my.length-1].body : ''}, read: 1, name: 'My notes'},
          canSwipe: 0,
          onclick: (chat) => ML.go('chat/me'),
          vw
        }))
      }

      for (let i in this.state.chats)
      {
        let chat = this.state.chats[i];
        if (chat.muted != muted) continue;  // skip it!

        chats.push(h(ChatRow,
        {
          user: this.props.user,
          chat,
          canSwipe: !this.state.blockSwipe,
          onclick: (chat) => { mixpanel.track('Chat - enter', {id: chat.id}); ML.go('chat/' + chat.id) },
          vw
        }))
      }

      if (!this.emailFilter.length || chats.length)
      {
        let fill = '#fff';
        ulContents =
        [
          h('ul', null,
            chats.length ? chats : h('div', {className: 'list-hint', style: {height: 'calc(100vh - 120px)'}},
              'Welcome to Hollo!',
              h('br'),
              'Wait a bit please until',
              h('br'),
              'your messages are fetched...'
            )
          ),
            this.emailFilter.length ? null : h('bottom-bar', null,
            h(BarIcon, {className: 'opa-85', caption: 'Profile', svg: 'profile', fill, onclick: () => { mixpanel.track('Sys - profile'); ML.go('profile') } }),
            h(BarIcon, {className: muted ? 'opa-85' : '', caption: 'Inbox', svg: 'email', fill, onclick: () => { mixpanel.track('Sys - holloed'); ML.go('chats') } } ),
            h(BarIcon, {className: muted ? '' : 'opa-85', caption: 'Muted', svg: 'muted', fill, onclick: () => { mixpanel.track('Sys - muted'); ML.go('chats', {muted: 1}) } } )
          )
        ];
      }
      else
      {
        ulContents = h('div', {className: 'list-hint'},
          'Wanna create a new chat?',
          h('br'),
          'Just type in an email!'
        )
      }
    }

    return (

      h('chats-page', {style: {zIndex: this.props.zIndex}, ontouchstart: this.touchStart.bind(this), ontouchmove: this.touchMove.bind(this), ontouchend: this.touchEnd.bind(this)},
        h(SearchBar,
        {
          value: '',
          placeholder: 'Search chat or start new',
          onchange: this.filterChanged.bind(this),
          onfocuschange: this.filterFocusChanged.bind(this),
          className: this.state.filterActive ? 'focused' : ''
        }),
        h('loader', null, h('inner-loader')),
        ulContents,
        h(QuickStack, {chats: this.state.chats, muted, user: this.props.user})
      )
    );
  }
}
