class ChatsPage extends Component
{
  constructor()
  {
    super();
    this.pageLength = Math.ceil(2.5 * (screen.height - 176) / 72);
    this.pageStart = 0;
    this.filterTimer = null;
    this.emailFilter = '';
    this.canLazyLoadMore = 0;
    this.lastCallFindParams = {};

    this.state.chats = [];
    this.state.blockSwipe = 0;
    this.state.filterActive = 0;
  }

  componentDidMount()
  {
    this.scrollReference = this.scroll.bind(this);
    this.chatUpdateReference = this.chatUpdate.bind(this);
    this.firebaseListenerRef = this.firebaseListener.bind(this);
    this.base.querySelector('ul').addEventListener('scroll', this.scrollReference);
    window.addEventListener('hollo:chatupdate', this.chatUpdateReference);
    window.addEventListener('hollo:firebase', this.firebaseListenerRef);
    this.callFind();
  }

  componentWillReceiveProps(nextProps)
  {
    this.props = nextProps;
    this.callFind();
  }

  componentWillUnmount()
  {
    this.base.querySelector('ul').removeEventListener('scroll', this.scrollReference);
    window.removeEventListener('hollo:chatupdate', this.chatUpdateReference);
    window.removeEventListener('hollo:firebase', this.firebaseListenerRef);
  }

  chatUpdate(e)
  {
    let found = 0, chats = this.state.chats;

    for (let i in chats)
    {
      if (e.payload.chat.id == chats[i].id)
      {
        found = 1;

        chats[i].forceUpdate = 1;
        chats[i].read = e.payload.chat.read;
        if (e.payload.chat.name) chats[i].name = e.payload.chat.name;

        if (e.payload.cmd == 'muted')
        {
          delete chats[i]
        }

        this.setState({chats});
        ML.emit('qs:count');

        break;
      }
    }

    if (!found)
    {
      // new chat -> force resync
      this.callFind(0, 1);
    }
  }

  firebaseListener(e)
  {
    if (e.payload.authId != this.props.user.id)
    {
      return
    }

    if (e.payload.cmd == 'show-chat' && !e.payload.wasTapped)
    {
      // check if the chat is present
      let found = 0, chats = this.state.chats;
      for (let i in chats)
      {
        if (e.payload.chatId == chats[i].id)
        {
          found = 1;
          // mark it as unread
          chats[i].read = 0;
          this.setState({chats});
          break;
        }
      }
      if (!found)
      {
        // full reload
        this.callFind();
      }
    }
  }

  callFind(shouldAdd = 0, force = 0)
  {
    let filters = [{mode: 'muted', value: this.props.data ? this.props.data.muted || 0 : 0}];

    if (this.emailFilter.length)
    {
      filters.push({mode:'email', value: this.emailFilter});
    }

    let callFindParams = {pageStart: this.pageStart, pageLength: this.pageLength, filters};

    if (this.lastCallFindParams.filters && callFindParams.filters[0].value != this.lastCallFindParams.filters[0].value)
    {
      // another mode => reset head
      this.pageStart = 0;
      callFindParams.pageStart = 0;
    }

    if (!force && JSON.stringify(callFindParams) == JSON.stringify(this.lastCallFindParams))
    {
      return
    }

    if (!shouldAdd)
    {
      this.pageStart = 0;
    }

    ML.emit('busybox', {mode: 1});

    ML.api('chat', 'find', this.lastCallFindParams = callFindParams, (data) =>
    {
      let chats = this.state.chats;

      if (!this.pageStart)
      {
        let first = this.base.querySelector('chat-row:first-child');
        if (first) first.scrollIntoView();
      }

      if (shouldAdd)
      {
        // this.pageStart += data.length;
        chats = chats.concat(data);
      }
      else
      {
        chats = data;
      }

      this.setState({chats});
      this.canLazyLoadMore = (data.length == this.pageLength && !this.emailFilter.length);

      ML.emit('qs:count');
      ML.emit('busybox', 0);
    });
  }

  touchStart(e)
  {
    let t = e.changedTouches[0];
    this.pull = 0;
    this.swiping = 0;
    this.startX = t.pageX;
    this.startY = t.pageY;
    this.ul = this.base.querySelector('loader');
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
        this.ul.style.height = 0;
      }
      else
      {
        this.ul.style.height = Math.min(distY, 300) + 'px';
        this.ul.style.opacity = distY/300;
        this.ul.style.transform = `rotate(${distY/1.5}deg)`
      }
      e.preventDefault()
    }

    if (Math.abs(distY) > 16 && !this.swiping)
    {
      if (!this.state.blockSwipe)
      {
        this.setState({blockSwipe: true});
      }

      if (distY > 48 && !this.pull)
      {
        this.pull = 1;
      }
    }
    e.stopPropagation();
  }

  touchEnd()
  {
    if (this.state.blockSwipe)
    {
      this.setState({blockSwipe: false});

      if (this.pull)
      {
        this.pull = 0;
        this.ul.style.height = 0;
        this.ul.style.transform = 'rotate(0)';
        this.ul.classList.add('travel');
        this.callFind(0, 1);
        setTimeout( () =>
        {
          this.ul.classList.remove('travel');
        }, 400);
      }
    }
  }

  scroll()
  {
    if (!this.canLazyLoadMore)
    {
      return;
    }

    let el = this.base.querySelector('chat-row:nth-last-child(2)');

    if (el && el.getBoundingClientRect().bottom < screen.height + 50)
    {
      // temporarily block it
      this.canLazyLoadMore = 0;
      this.pageStart += this.pageLength;
      this.callFind(1);

      mixpanel.track('Chat - get more');
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
        this.callFind();
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
        h(ChatRow, {chat: {users: [{email, name: email}], read:1, last: {msg:'Create a chat with ' + email}}, canSwipe: 0, onclick: this.addNew.bind(this)})
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
      let chats = [], vw = windowInnerWidth > 768 ? 360 : windowInnerWidth;

      // self-chat
      if (CFG.showNotes && (!this.props.data || !this.props.data.muted))
      {
        let my = JSON.parse(localStorage.getItem('messages')) || [];
        chats.push(h(ChatRow,
        {
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
          chat,
          canSwipe: !this.state.blockSwipe,
          onclick: (chat) => ML.go('chat/' + chat.id),
          vw
        }))
      }

      if (!this.emailFilter.length || chats.length)
      {
        let fill = '#fff';
        ulContents =
        [
          h('ul', null,
            chats
          ),
            this.emailFilter.length ? null : h('bottom-bar', null,
            h(BarIcon, {className: 'opa-85', caption: 'Profile', svg: 'profile', fill, onclick: () => ML.go('profile')}),
            h(BarIcon, {className: muted ? 'opa-85' : '', caption: 'Inbox', svg: 'email', fill, onclick: () => ML.go('chats') }),
            h(BarIcon, {className: muted ? '' : 'opa-85', caption: 'Muted', svg: 'muted', fill, onclick: () => ML.go('chats', {muted: 1}) })
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
        h('loader'),
        ulContents,
        h(QuickStack, {chats: this.state.chats, muted, user: this.props.user})
      )
    );
  }
}
