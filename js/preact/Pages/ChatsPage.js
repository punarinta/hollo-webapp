class ChatsPage extends Component
{
  constructor()
  {
    super();
    this.state.muted = 0;
    this.state.pageStart = 0;
    this.state.pageLength = Math.ceil(2.5 * (screen.height - 176) / 72);
    this.state.chats = [];
    this.state.blockSwipe = 0;
  }

  componentDidMount()
  {
    let filters = [{mode: 'muted', value: this.state.muted}];

    ML.api('chat', 'find', {pageStart: 0, pageLength: this.state.pageLength, filters: filters, sortBy: 'lastTs'}, (data) =>
    {
      this.setState({chats: data})
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
      this.setState({blockSwipe: true});

      if (distY > 72)
      {
        this.pull = 1;
        this.ul.style.transform = `translateY(${Math.min(distY, 216)}px)`;
      }
    }
  }

  touchEnd()
  {
    this.setState({blockSwipe: false});
    this.ul.style.transform = 'translateY(0)';

    if (this.pull)
    {
      //CO.show(20);
    }
  }

  render()
  {
    let chats = [];

    for (let i in this.state.chats)
    {
      chats.push(h(ChatRow, {chat: this.state.chats[i], canSwipe: !this.state.blockSwipe}))
    }

    return (

      h('chats-page', {ontouchstart: this.touchStart.bind(this), ontouchmove: this.touchMove.bind(this), ontouchend: this.touchEnd.bind(this)},
        h('ul', null,
          chats
        )
      )
    );
  }
}