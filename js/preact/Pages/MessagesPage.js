class MessagesPage extends Component
{
  constructor()
  {
    super();
    this.pageStart = 0;
    this.pageLength = 20;
    this.subjectFilter = '';
    this.canLoadMore = 0;
    this.chat = null;

    this.state.h = 64;
    this.state.messages = [];
  }

  componentDidMount()
  {
    this.scrollReference = this.scroll.bind(this);
    window.addEventListener('scroll', this.scrollReference);
    this.callFind();

    /*let cmpText = this.base.querySelector('textarea');

    autosize(cmpText);
    cmpText.addEventListener('autosize:resized', (e) =>
    {
      let h = Math.min(parseInt(e.target.style.height, 10), window.innerHeight * .3);

      this.setState({h});
    });*/
  }

  componentWillUnmount()
  {
    window.removeEventListener('scroll', this.scrollReference);

    //this.base.querySelector('textarea').dispatchEvent(new Event('autosize:destroy'));
  }

  callFind(shouldAdd = 0)
  {
    ML.api('message', 'findByChatId', {chatId: this.props.data.chatId, pageStart: this.pageStart, pageLength: this.pageLength}, (data) =>
    {
      this.canLoadMore = (data.messages.length == this.pageLength);
      this.chat = data.chat;

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

  composerTextChanged(e)
  {
    let t = e.target;
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 3 + 'px';
  }

  render()
  {
    let messages = [],
        name = this.chat ? ML.xname(this.chat)[0] : '';

    for (let i in this.state.messages)
    {
      messages.push(h(MessageBubble, {message: this.state.messages[i], user: this.props.user}))
    }

    return (

      h('messages-page', null,
        h('snackbar', null,
          h(BarIcon, {img: 'color/arrow-back', onclick: () => ML.go('chats')}),
          h('div', {className: 'name'}, name),
          h(BarIcon, {img: 'color/subjs', width: 40, height: 40, onclick: () => {} }),
          h(BarIcon, {img: 'color/clip', width: 40, height: 40, onclick: () => {} }),
          h(BarIcon, {img: 'color/more-vert', width: 40, height: 40, onclick: () => {} })
        ),
        h('ul', null,
          messages
        ),
        h('composer', null,
          h('textarea', {rows:1, placeholder: 'Write a new hollo...', onkeyup: this.composerTextChanged.bind(this)})
        )
      )
    );
  }
}