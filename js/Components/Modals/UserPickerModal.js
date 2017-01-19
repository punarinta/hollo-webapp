class UserPickerModal extends Component
{
  constructor()
  {
    super();
    this.filterTimer = null;
    this.emailFilter = '';
    this.state.users = [];
    this.displayPerScreen = (screen.height - 160) / 32 + 1;
    this.state.maxDisplay = this.displayPerScreen;
  }

  componentDidMount()
  {
    this.base.querySelector('ul').addEventListener('scroll', this.scroll.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('hollo:users:update', this.usersUpdate.bind(this));
    window.addEventListener('hollo:chat:update', this.chatsUpdate.bind(this));
  }

  onKeyUp(e)
  {
    if (this.props.data && e.keyCode == 27) ML.emit('userpicker')
  }

  usersUpdate()
  {
    this.setState({users: $.U.filter(this.emailFilter.length ? this.emailFilter : null)})
  }

  chatsUpdate()
  {
    this.setState({chats: $.C.filter({email: this.emailFilter.length ? this.emailFilter : null})})
  }

  filterChanged(filter)
  {
    clearTimeout(this.filterTimer);

    this.filterTimer = setTimeout( () =>
    {
      if (this.emailFilter != filter)
      {
        this.emailFilter = filter;
        this.setState({maxDisplay: this.displayPerScreen});
        this.props.data.chatMode ? this.chatsUpdate() : this.usersUpdate();
      }
    }, 500);
  }

  onBgClick(e)
  {
    if (e.target.nodeName.toLowerCase() == 'user-picker-modal')
    {
      this.props.onclose()
    }
  }

  onSelect(user)
  {
    this.props.onclose();
    if (typeof this.props.data.onselect == 'function') this.props.data.onselect(user)
  }

  scroll()
  {
    let el = this.base.querySelector('li:nth-last-child(2)');

    if (el && el.getBoundingClientRect().bottom < screen.height + 50)
    {
      this.setState({maxDisplay: this.state.maxDisplay + this.displayPerScreen});
    }
  }

  render(props)
  {
    if (!props.data)
    {
      return h('user-picker-modal', {style: {display: 'none'}}, h('div', null, h('ul')));
    }

    let items = [], count = 0;

    if (props.data.chatMode)
    {
      for (let i in this.state.chats)
      {
        if (count > this.state.maxDisplay) break;

        let chat = this.state.chats[i],
            name = ML.xname(chat);

        // set them to 'read' visually
        chat.read = 1;

        items.push(h('li', { onclick: () => this.onSelect(chat) },
          h(Avatar, {size: 32, chat}),
          h('div', null, name[0])
        ));

        ++count;
      }
    }
    else
    {
      for (let i in this.state.users)
      {
        if (count > this.state.maxDisplay) break;

        let user = this.state.users[i];

        items.push(h('li', { onclick: () => this.onSelect(user) },
          h(Avatar, {size: 32, user}),
          h('div', null, user.name || user.email)
        ));

        ++count;
      }
    }

    return h('user-picker-modal', {onclick: this.onBgClick.bind(this)},
      h('div', null,
        h(SearchBar,
        {
          placeholder: 'Search for contact',
          onchange: this.filterChanged.bind(this)
        }),
        h('ul', null,
          items
        )
      )
    )
  }
}