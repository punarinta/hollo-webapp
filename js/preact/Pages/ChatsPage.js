class ChatsPage extends Component
{
  constructor()
  {
    super();
    this.state.muted = 0;
    this.state.pageStart = 0;
    this.state.pageLength = Math.ceil(2.5 * (screen.height - 176) / 72);
    this.state.chats = [];
  }

  componentDidMount()
  {
    let filters = [{mode: 'muted', value: this.state.muted}];

    ML.api('chat', 'find', {pageStart: 0, pageLength: this.state.pageLength, filters: filters, sortBy: 'lastTs'}, (data) =>
    {
      this.setState({chats: data})
    });
  }

  render()
  {
    let chats = [];

    for (let i in this.state.chats)
    {
      chats.push(h(ChatRow, {chat: this.state.chats[i]}))
    }

    return (

      h('chats-page', null,
        h('ul', null,
          chats
        )
      )
    );
  }
}