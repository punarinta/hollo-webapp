class MessagesPage extends Component
{
  render()
  {
    let messages = [];

    return (

      h(
        'messages-page', null,
        h('ul', null, messages)
      )
    );
  }
}