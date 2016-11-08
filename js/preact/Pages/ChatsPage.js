class ChatsPage extends Component
{
  constructor()
  {
    super();
    this.pageLength = Math.ceil(2.5 * (screen.height - 176) / 72);
    this.pageStart = 0;
    this.filterTimer = null;
    this.emailFilter = '';
    this.canLoadMore = 0;
    this.muted = 0;

    this.state.chats = [];
    this.state.blockSwipe = 0;
    this.state.filterActive = 0;
  }

  componentDidMount()
  {
    this.scrollReference = this.scroll.bind(this);
    window.addEventListener('scroll', this.scrollReference);
    this.callFind();
  }

  componentWillUnmount()
  {
    window.removeEventListener('scroll', this.scrollReference);
  }

  callFind(shouldAdd = 0)
  {
    let filters = [{mode: 'muted', value: this.muted}];

    if (this.emailFilter.length)
    {
      filters.push({mode:'email', value: this.emailFilter});
    }

    ML.api('chat', 'find', {pageStart: this.pageStart, pageLength: this.pageLength, filters: filters, sortBy: 'lastTs'}, (data) =>
    {
      this.canLoadMore = (data.length == this.pageLength);

      if (shouldAdd)
      {
        this.pageStart += data.length;
        this.setState({chats: this.state.chats.concat(data)});
      }
      else
      {
        this.setState({chats: data})
      }
    });
  }

  touchStart(e)
  {
    this.pull = 0;
    this.startY = e.changedTouches[0].pageY;
    this.ul = this.base.querySelector('ul');
  }

  touchMove(e)
  {
    let distY = e.changedTouches[0].pageY - this.startY;

    if (Math.abs(distY) > 16)
    {
      if (!this.state.blockSwipe)
      {
        this.setState({blockSwipe: true});
      }

      if (distY > 72)
      {
        this.pull = 1;
        this.ul.style.transform = `translateY(${Math.min(distY, 216)}px)`;
      }
    }
  }

  touchEnd()
  {
    if (this.state.blockSwipe)
    {
      this.setState({blockSwipe: false});
      this.ul.style.transform = 'translateY(0)';

      if (this.pull)
      {
        this.callFind();
      }
    }
  }

  scroll()
  {
    if (!this.canLoadMore)
    {
      return;
    }

    let el = this.base.querySelector('chat-row:nth-last-child(2)');

    if (el && el.getBoundingClientRect().bottom < screen.height + 50)
    {
      this.canLoadMore = 0;
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

  showHolloed()
  {
    this.muted = 0;
    this.callFind();
  }

  showMuted()
  {
    this.muted = 1;
    this.callFind();
  }

  render()
  {
    let chats = [];

    for (let i in this.state.chats)
    {
      chats.push(h(ChatRow, {chat: this.state.chats[i], canSwipe: !this.state.blockSwipe, onclick: (chat) => ML.go('chat/' + chat.id)}))
    }

    let normalPart =
    [
      h('ul', null,
        chats
      ),
      h(BottomBar, null,
        h(BarIcon, {caption: 'Profile', img: 'white/profile_new.svg', onclick: () => ML.go('profile')}),
        h(BarIcon, {caption: 'Hollo`d', img: 'white/email_new.svg', onclick: this.showHolloed.bind(this)}),
        h(BarIcon, {caption: 'Muted', img: 'white/muted_new.svg', onclick: this.showMuted.bind(this)})
      )
    ];

    return (

      h('chats-page', {ontouchstart: this.touchStart.bind(this), ontouchmove: this.touchMove.bind(this), ontouchend: this.touchEnd.bind(this)},
        h(SearchBar,
        {
          placeholder: 'Search chat or start new',
          onchange: this.filterChanged.bind(this),
          onfocuschange: this.filterFocusChanged.bind(this),
          className: this.state.filterActive ? 'focused' : ''
        }),
        this.state.filterActive && !this.emailFilter.length ? h('div', {className: 'filter-hint'},
          'To start a new',
          h('br'),
          'conversation type in',
          h('br'),
          'an email address.'
        ) : normalPart
      )
    );
  }
}