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
    this.displayPerScreen = screen.height / 72 + 1;
    this.state.maxDisplay = this.displayPerScreen;
    this.state.toast = null;
  }

  componentDidMount()
  {
    this.scrollReference = this.scroll.bind(this);
    this.chatUpdateReference = this.chatUpdate.bind(this);
    this.toastReference = this.toast.bind(this);
    this.base.querySelector('ul').addEventListener('scroll', this.scrollReference);
    window.addEventListener('hollo:chat:update', this.chatUpdateReference);
    window.addEventListener('hollo:toast', this.toastReference);
  }

  componentWillReceiveProps(nextProps)
  {
    if (JSON.stringify(nextProps) !== this.propsString)
    {
      this.props = nextProps;
      this.propsString = JSON.stringify(nextProps);
      this.chatUpdate();
    }
  }

  componentWillUnmount()
  {
    this.base.querySelector('ul').removeEventListener('scroll', this.scrollReference);
    window.removeEventListener('hollo:chat:update', this.chatUpdateReference);
  }

  chatUpdate()
  {
    this.setState({chats: $.C.filter(
    {
      muted: !!(this.props.data ? this.props.data.muted : 0),
      email: this.emailFilter.length ? this.emailFilter : null
    })});
    ML.emit('qs:count');
  }

  toast(e)
  {
    //if (['mute', 'unmute'].indexOf(e.payload.action))
    console.log(e);
    this.setState({toast: e.payload})
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
      let el = this.base.querySelector('chat-row:first-child');

      if (this.pull == 2 && (!el || el.getBoundingClientRect().top > 0))
      {
        this.ul.classList.add('travel');
        ML.emit('busybox', {mode: 1});
        $.C.sync(this.props.user, () =>
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

    if (filter == 'debug-logout') ML.go('auth/logout');

    this.filterTimer = setTimeout( () =>
    {
      if (this.emailFilter != filter)
      {
        this.emailFilter = filter;
        this.setState({maxDisplay: this.displayPerScreen});
        this.chatUpdate();
        mixpanel.track('Sys - filter', {keyword: filter});
      }
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
      // add chat to the storage first
      $.C.set(this.props.user, data.id, data);
      this.setState({menuModalShown: 0});
      ML.go('chat/' + data.id);
    });
    mixpanel.track('Chat - add new');
  }

  scroll()
  {
    let el = this.base.querySelector('chat-row:nth-last-child(2)');

    if (el && el.getBoundingClientRect().bottom < screen.height + 50)
    {
      this.setState({maxDisplay: this.state.maxDisplay + this.displayPerScreen});
      mixpanel.track('Chat - get more');
    }
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
          messages: [{ body: _('CAP_NEW_CHAT', [email]) }]},
          canSwipe: 0,
          onclick: this.addNew.bind(this)
        })
      )
    }
    else if (this.state.filterActive && !this.emailFilter.length)
    {
      ulContents = h('div', {className: 'list-hint'}, _('HINT_FLT_ON'))
    }
    else
    {
      let chats = [], vw = $windowInnerWidth > 768 ? 360 : $windowInnerWidth;

      // self-chat
      if (CFG.showNotes && !this.props.data.muted)
      {
        let my = JSON.parse(localStorage.getItem('my-notes')) || [];
        chats.push(h(ChatRow,
        {
          user: this.props.user,
          chat: {users: [this.props.user], messages: my, read: 1, name: _('CAP_MY_NOTES')},
          canSwipe: 0,
          onclick: (chat) => ML.go('chat/me'),
          vw
        }))
      }

      let count = 0;
      for (let i in this.state.chats)
      {
        if (count > this.state.maxDisplay) break;

        let chat = this.state.chats[i];
        if (chat.muted != muted) continue;  // skip it!

        chats.push(h(ChatRow,
        {
          user: this.props.user,
          chat,
          canSwipe: !this.state.blockSwipe,
          onclick: (chat) =>
          {
            this.setState({selectedChatId: chat.id});
            ML.go('chat/' + chat.id);
            mixpanel.track('Chat - enter', {id: chat.id})
          },
          selected: this.state.selectedChatId == chat.id,
          vw
        }));

        ++count;
      }

      if (!this.emailFilter.length || chats.length)
      {
        let fill = '#fff';
        ulContents =
        [
          h('ul', null,
            chats.length ? chats : h('div', {className: 'list-hint', style: {height: 'calc(100vh - 120px)'}}, _('HINT_SYNCING'))
          ),
            this.emailFilter.length ? null : h('bottom-bar', null,
            h(BarIcon, {className: 'opa-85', caption: _('BTN_PROFILE'), svg: 'profile', fill, onclick: () => { ML.go('profile'); mixpanel.track('Sys - profile') } }),
            h(BarIcon, {className: muted ? 'opa-85' : '', caption: _('BTN_INBOX'), svg: 'email', fill, onclick: () => { ML.go('chats'); mixpanel.track('Sys - holloed') } } ),
            h(BarIcon, {className: muted ? '' : 'opa-85', caption: _('BTN_MUTED'), svg: 'muted', fill, onclick: () => { ML.go('chats', {muted: 1}); mixpanel.track('Sys - muted') } } )
          )
        ];
      }
      else
      {
        ulContents = h('div', {className: 'list-hint'}, _('HINT_NEW_CHAT'))
      }
    }

    let sbClasses = [];
    if (this.emailFilter.length) sbClasses.push('filtered');
    if (this.state.filterActive) sbClasses.push('focused');

    let toaster = '';

    if (this.state.toast)
    {
      toaster =
      [
        h('caption', null, this.state.toast.caption),
        h('button', {onclick: this.state.toast.action}, 'undo')
      ]
    }

    return (

      h('chats-page', {style: {zIndex: this.props.zIndex}, ontouchstart: this.touchStart.bind(this), ontouchmove: this.touchMove.bind(this), ontouchend: this.touchEnd.bind(this)},
        h(SearchBar,
        {
          value: '',
          placeholder: _('HINT_CHAT_SEARCH'),
          onchange: this.filterChanged.bind(this),
          onfocuschange: this.filterFocusChanged.bind(this),
          className: sbClasses.join(' '),
          autocolor: true
        }),
        h('loader', null, h('inner-loader')),
        ulContents,
        h(QuickStack, {chats: this.state.chats, muted, user: this.props.user}),
        h('toast', {style: {height: this.state.toast ? '48px' : 0}}, toaster)
      )
    );
  }
}
