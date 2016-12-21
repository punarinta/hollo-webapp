class UserPickerModal extends Component
{
  constructor()
  {
    super();
    this.filterTimer = null;
    this.emailFilter = '';
    this.state.users = [];
  }

  componentDidMount()
  {
    this.usersUpdateReference = this.usersUpdate.bind(this);
    window.addEventListener('hollo:users:update', this.usersUpdateReference);
  }

  componentWillUnmount()
  {
    window.removeEventListener('hollo:users:update', this.usersUpdateReference);
  }

  usersUpdate()
  {
    this.setState({users: U.filter(this.emailFilter.length ? this.emailFilter : 0)})
  }

  filterChanged(filter)
  {
    clearTimeout(this.filterTimer);

    this.filterTimer = setTimeout( () =>
    {
      if (this.emailFilter != filter)
      {
        this.emailFilter = filter;
        this.usersUpdate();
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

  render()
  {
    if (!this.props.data) return h('user-picker-modal', {style: {display: 'none'}});

    let userRows = [];

    for (let i in this.state.users)
    {
      let user = this.state.users[i];

      userRows.push(h('li', {onclick: () => this.onSelect(user)},
        h(Avatar, {size: 32, user}),
        h('div', null, user.name || user.email)
      ))
    }

    return h('user-picker-modal', {onclick: this.onBgClick.bind(this)},
      h('div', null,
        h(SearchBar,
        {
          placeholder: 'Search for contact',
          onchange: this.filterChanged.bind(this)
        }),
        h('ul', null,
          userRows
        )
      )
    )
  }
}