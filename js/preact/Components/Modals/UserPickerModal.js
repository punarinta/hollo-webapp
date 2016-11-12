class UserPickerModal extends Component
{
  constructor()
  {
    super();
    this.state.users = [];
  }

  componentDidMount()
  {
    this.callFind();
  }

  callFind()
  {
    let params = {pageStart: 0, pageLength: 25};
    // if (filter && filter.length) params.filters = [{mode:'email', value:filter}];

    ML.api('contact', 'find', params, (users) =>
    {
      this.setState({users})
    })
  }

  onBgClick(e)
  {
    if (e.target.nodeName.toLowerCase() == 'user-picker-modal')
    {
      this.props.onclose()
    }
  }

  render()
  {
    if (!this.props.data) return h('user-picker-modal', {style: {display: 'none'}});

    let userRows = [];

    for (let i in this.state.users)
    {
      userRows.push(h('li', null,
        h(Avatar, {size: 32, user: this.state.users[i]}),
        h('div', null, this.state.users[i].name)
      ))
    }

    return h('user-picker-modal', {onclick: this.onBgClick.bind(this)},
      h('div', null,
        h(SearchBar),
        h('ul', null,
          userRows
        )
      )
    )
  }
}