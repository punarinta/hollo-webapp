class MessagesPage extends Component
{
  constructor()
  {
    super();
    this.pageStart = 0;
    this.pageLength = 20;
    this.subjectFilter = '';
    this.canLoadMore = 0;

    this.state.messages = [];
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
    ML.api('message', 'findByChatId', {chatId: this.props.data.chatId, pageStart: this.pageStart, pageLength: this.pageLength}, (data) =>
    {
      this.canLoadMore = (data.messages.length == this.pageLength);

      data.messages = data.messages.reverse();

      if (shouldAdd)
      {
        this.pageStart += data.messages.length;
        this.setState({messages: data.messages.concat(this.state.messages)});
      }
      else
      {
        this.setState({messages: data.messages})
      }
    });
  }

  scroll()
  {
    if (!this.canLoadMore)
    {
      return;
    }

    let el = this.base.querySelector('message-bubble:nth-child(2)');

    if (el && el.getBoundingClientRect().top > 0)
    {
      this.canLoadMore = 0;
      this.pageStart += this.pageLength;
      this.callFind(1);

      mixpanel.track('Messages - get more');
    }
  }

  render()
  {
    let messages = [];

    for (let i in this.state.messages)
    {
      messages.push(h(MessageBubble, {message: this.state.messages[i], user: this.props.user}))
    }

    return (

      h('messages-page', null,
        h('snackbar', null,
          h(BarIcon, {img: 'color/arrow-back', onclick: () => history.go(-1)}),
          h('div', {className: 'name'}, 'Hello'),
          h(BarIcon, {img: 'color/subjs', width: 40, height: 40, onclick: () => {} }),
          h(BarIcon, {img: 'color/clip', width: 40, height: 40, onclick: () => {} }),
          h(BarIcon, {img: 'color/more-vert', width: 40, height: 40, onclick: () => {} })
        ),
        h('ul', null,
          messages
        ),
        h('composer')
      )
    );
  }
}