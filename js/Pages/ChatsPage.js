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

    this.state.qs = [];
    this.state.chats = [];
    this.state.qsCount = 0;
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

        if (chats[i].muted != e.payload.chat.muted)
        {
          // list changed, reloading must be administered
          // TODO: refactor in a way without API calls
          this.pageStart = 0;
          this.callFind();
          break;
        }

        chats[i].forceUpdate = 1;
        chats[i].read = e.payload.chat.read;
        if (e.payload.chat.name) chats[i].name = e.payload.chat.name;

        this.setState({chats});
        this.qsCount();

        break;
      }
    }

    if (!found)
    {
      // new chat -> resync
      this.callFind();
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

    let callFindParams = {pageStart: this.pageStart, pageLength: this.pageLength, filters, sortBy: 'lastTs'};

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

    ML.emit('busybox', 1);

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
      this.qsCount();

      this.canLazyLoadMore = (data.length == this.pageLength);

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
    this.ul = this.base.querySelector('ul');
  }

  qsTouchStart(e)
  {
    let t = e.changedTouches[0];
    this.swiping = 0;
    this.startX = t.pageX;
    this.startY = t.pageY;
    this.ul = this.base.querySelector('quick-stack');
    this.ul.style.willChange = 'transform';
    e.stopPropagation()
  }

  touchMove(e)
  {
    let distY = e.changedTouches[0].pageY - this.startY,
        distX = e.changedTouches[0].pageX - this.startX;

    if (Math.abs(distX) > 32)
    {
      this.swiping = 1;
    }

    /*if (this.pull)
    {
      this.ul.style.transform = `translateY(${Math.min(distY, 216)}px)`;
    }*/

    if (Math.abs(distY) > 16 && !this.swiping)
    {
      if (!this.state.blockSwipe)
      {
        this.setState({blockSwipe: true});
      }

      /*if (distY > 48 && !this.pull)
      {
        this.pull = 1;
        this.ul.style.overflowY = 'hidden';
      }*/
    }
    e.stopPropagation();
  }

  qsTouchMove(e)
  {
    let distX = e.changedTouches[0].pageX - this.startX,
        distY = e.changedTouches[0].pageY - this.startY;

    if (Math.abs(distX) > 32)
    {
      this.swiping = 1;
    }

    if (distX > 100) this.ul.style.backgroundColor = '#F5F5DC';       // yellow
    else if (distX < -100) this.ul.style.backgroundColor= '#F0FFF0';  // green
    else this.ul.style.backgroundColor = '#fff';                      // none

    if (this.swiping) this.ul.style.transform = `translate(${distX}px, ${distY}px)`;
    e.stopPropagation()
  }

  touchEnd()
  {
    if (this.state.blockSwipe)
    {
      this.setState({blockSwipe: false});
      this.ul.style.transform = 'translateY(0)';

      if (this.pull)
      {
        this.pull = 0;
        this.ul.style.overflowY = 'auto';
        this.ul.classList.add('travel');
        this.callFind(0, 1);
        setTimeout( () =>
        {
          this.ul.classList.remove('travel');
        }, 400);
      }
    }
  }

  qsTouchEnd(e)
  {
    this.swiping = 0;
    this.ul.style.transform = 'translate(0,0)';
    this.ul.style.backgroundColor = '#fff';

    let distX = e.changedTouches[0].pageX - this.startX;

    if (distX > 100) this.qsSkip();
    else if (distX < -100) this.qsMarkRead(this.state.qs[0]);
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

  qsCount()
  {
    let qsCount = 0;
    for (let i in this.state.chats)
    {
      if (!this.state.chats[i].read) ++qsCount;
    }
    this.setState({qsCount});
  }

  qsShow()
  {
    ML.api('message', 'buildQuickStack', {muted: this.props.data ? this.props.data.muted : 0}, qs =>
    {
      this.setState({quickStackShown: 1, qs});
    });
  }

  qsReply(qsCurrent)
  {
    let qsCount = this.state.qsCount - 1;
    // TODO: update chat
    this.setState({quickStackShown: 0, qsCount});
    ML.go('chat/' + qsCurrent.chatId)
  }

  qsSkip()
  {
    let qs = this.state.qs;
    qs.shift();
    let qsCount = qs.length;
    this.setState({qs, qsCount, quickStackShown: qsCount > 0});
  }

  qsMarkRead(qsCurrent)
  {
    let chat = null;
    for (let i in this.state.chats)
    {
      if (qsCurrent.chatId == this.state.chats[i].id)
      {
        chat = this.state.chats[i];
        break;
      }
    }

    if (chat)
    {
      chat.read = 1;
      ML.api('chat', 'update', {id: chat.id, read: 1});
      ML.emit('chatupdate', {chat});
    }

    this.qsSkip()
  }

  render()
  {
    let quickStackModal = h('div', {className: 'qs-shader', style: {display: 'none'}}),
        ulContents = '', muted = this.props.data ? this.props.data.muted : 0;

    if (ML.isEmail(this.emailFilter))
    {
      let email = this.emailFilter;
      ulContents = h('ul', null,
        h(ChatRow, {chat: {users: [{email, name: email}], read:1, last: {msg:'Create a chat with ' + email}}, canSwipe: 0, onclick: this.addNew.bind(this)})
      )
    }
    else if (this.state.filterActive && !this.emailFilter.length)
    {
      ulContents = h('div', {className: 'filter-hint'},
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

      for (let i in this.state.chats)
      {
        if (this.state.chats[i].muted != muted) continue;  // skip it!
        chats.push(h(ChatRow,
        {
          chat: this.state.chats[i],
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
            h(BarIcon, {className: muted ? 'opa-85' : '', caption: 'Inbox', svg: 'email', fill, onclick: () =>ML.go('chats') }),
            h(BarIcon, {className: muted ? '' : 'opa-85', caption: 'Muted', svg: 'muted', fill, onclick: () =>ML.go('chats', {muted: 1}) })
          )
        ];
      }
      else
      {
        ulContents = h('div', {className: 'filter-hint'},
          'Wanna create a new chat?',
          h('br'),
          'Just type in an email!'
        )
      }
    }

    let qsButton = h('qs-button', {style: {display: this.state.qsCount > 0 ? 'flex' : 'none'}, onclick: this.qsShow.bind(this) },
      h(BarIcon, {svg: 'timer', fill: '#fff'}),
      h('div', null, this.state.qsCount + ' unread')
    );

    if (this.state.quickStackShown && this.state.qs.length)
    {
      // always the topmost that is shown
      let fakeUser = null, qsCurrent = this.state.qs[0];

      if (qsCurrent.fromId == this.props.user.id)
      {
        fakeUser = this.props.user
      }
      else for (let i in this.state.chats)
      {
        for (let j in this.state.chats[i].users)
        {
          let u = this.state.chats[i].users[j];
          if (u.id == qsCurrent.fromId)
          {
            fakeUser = u;
            break;
          }
        }
      }

      // fake a message
      let message =
      {
        id: qsCurrent.id,
        body: qsCurrent.body,
        subject: qsCurrent.subject,
        refId: qsCurrent.refId,
        ts: qsCurrent.ts,
        files: qsCurrent.files ? JSON.parse(qsCurrent.files) : null,
        from: fakeUser
      };

      quickStackModal = h('qs-shader', {onclick: (e) => {if (e.target.nodeName.toLowerCase() == 'qs-shader') this.setState({quickStackShown: 0})} },
        h('quick-stack', { ontouchstart: this.qsTouchStart.bind(this), ontouchmove: this.qsTouchMove.bind(this), ontouchend: this.qsTouchEnd.bind(this) },
          h('topbar', null,
            h(Avatar, {user: fakeUser, size: 32}),
            h('div', null, ML.xname({users:[fakeUser]})[0])
          ),
          h(MessageBubble, {message, user: this.props.user}),
          h('bar', null,
            h('button', {onclick: () => this.qsMarkRead(qsCurrent)}, 'Mark as read'),
            h('button', {onclick: () => this.qsReply(qsCurrent)}, 'Reply'),
            h('button', {onclick: () => this.qsSkip() }, 'Leave for later')
          )
        ),
        h('qs-indicator', {},
          h(Svg, {model: 'timer', fill: '#fff'}),
          h('div', null, this.state.qsCount + ' to go'),
          h(BarIcon, {svg: 'cross', fill: '#fff', type: 'polygon', width: 14, height: 14, onclick: () => this.setState({quickStackShown: 0}) })
        )
      )
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
        ulContents,
        qsButton,
        quickStackModal
      )
    );
  }
}