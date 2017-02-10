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
    this.base.querySelector('ul').addEventListener('scroll', this.scrollReference);
    window.addEventListener('hollo:chat:update', this.chatUpdateReference);
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
        this.ul.style.transform = `translateY(${distY*0.3}px)`;
        this.ul.style.display = 'block'
      }
      e.preventDefault()
    }

    if (Math.abs(distY) > 16 && !this.swiping)
    {

      if (!this.state.blockSwipe)
      {
        this.setState({blockSwipe: true});
      }

      if (distY > 128) this.pull = 2;
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

        $.C.sync(this.props.user);

        setTimeout( () =>
        {
          this.ul.classList.remove('travel');
          this.ul.style.display = 'none'
        }, 400);
      }

      this.pull = 0;
      this.ul.style.opacity = 0;
      this.ul.style.transform = 'translateY(0)';
      this.ulin.style.transform = 'rotate(0)';
      this.setState({blockSwipe: false});
    }
  }

  filterChanged(keyword)
  {
    clearTimeout(this.filterTimer);

    if (keyword == 'debug-logout') ML.go('auth/logout');

    this.filterTimer = setTimeout( () =>
    {
      if (this.emailFilter != keyword)
      {
        this.emailFilter = keyword;
        this.setState({maxDisplay: this.displayPerScreen});
        this.chatUpdate();
        mixpanel.track('Sys - filter', {keyword});
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
      $.U.set(null, data.users);
      $.C.set(this.props.user, data.chat.id, data.chat);
      this.setState({menuModalShown: 0});
      ML.go('chat/' + data.chat.id);
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

  render(props)
  {
    let ulContents = '', muted = props.data ? props.data.muted : 0;

    if (ML.isEmail(this.emailFilter))
    {
      let email = this.emailFilter;
      ulContents = h('ul', null,
        h(ChatRow,
        {
          user: props.user,
          chat: {id: 'new', users: [{email, name: email}],
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
      if (CFG.showNotes && !props.data.muted)
      {
        let user = this.props.user, my = props.notes || [];
        chats.push(h(ChatRow,
        {
          user,
          chat: {users: [user], messages: my, read: 1, name: _('CAP_MY_NOTES')},
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

        if (muted < 2)
          chats.push(h(ChatRow,
          {
            user: props.user,
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

      if (muted == 2)
      {
        chats.push(h(Maga, {type: 'a'}));
        chats.push(h(Maga, {type: 'b'}));
        chats.push(h(Maga, {type: 'c'}));
      }

      if (!this.emailFilter.length || chats.length)
      {
        ulContents =
        [
          h('ul', null,
            chats.length ? chats : h('div', {className: 'list-hint', style: {height: 'calc(100vh - 120px)'}}, muted == 2 ? _('HINT_NO_MSGS') : _('HINT_SYNCING'))
          ),
            this.emailFilter.length ? null : h('bottom-bar', null,
            h(BarIcon, { svg: 'email', fill: muted == 1 ? '#7a4df9' : '#b2b2b2', height: 22, onclick: () => { ML.go('chats', {muted: 1}); mixpanel.track('Sys - muted') } } ),
            h(BarIcon, { svg: 'msg', fill: muted == 0 ? '#7a4df9' : '#b2b2b2', className: 'msg', onclick: () => { ML.go('chats'); mixpanel.track('Sys - holloed') } } ),
            h(BarIcon, { svg: 'maga', fill: muted == 2 ? '#7a4df9' : '#b2b2b2', height: 18, onclick: () => { ML.go('chats', {muted: 2}); mixpanel.track('Sys - maga') } } )
          )
        ];
      }
      else
      {
        ulContents = h('div', {className: 'list-hint'}, _('HINT_NEW_CHAT'))
      }
    }

    let seacrhFocused = [];

    if (this.state.filterActive) seacrhFocused = 'focused';

    return (

      h('chats-page', {style: {zIndex: props.zIndex}, ontouchstart: this.touchStart.bind(this), ontouchmove: this.touchMove.bind(this), ontouchend: this.touchEnd.bind(this)},
        h(SearchBar,
        {
          value: '',
          placeholder: _('HINT_CHAT_SEARCH'),
          onchange: this.filterChanged.bind(this),
          onfocuschange: this.filterFocusChanged.bind(this),
          className: seacrhFocused
        }),
        h(BarIcon,
        {
          svg: 'gear',
          type: 'complex',
          className: 'gear ' + seacrhFocused,
          width: 24,
          height: 24,
          fill: '#e2e2e2',
          onclick: () => { ML.go('profile'); mixpanel.track('Sys - profile') }
          }),
        h('loader', null, h('inner-loader')),
        ulContents,
        h(QuickStack, {chats: this.state.chats, muted, user: props.user})
      )
    );
  }
}
