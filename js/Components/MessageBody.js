class MessageBody extends Component
{
  componentDidMount()
  {
    this.base.innerHTML = this.props.html;
  }

  componentDidUpdate()
  {
    this.base.innerHTML = this.props.html;
  }

  render(props)
  {
    return h('message-body', {onclick: props.onclick})
  }
}