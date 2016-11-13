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

  render()
  {
    return h('message-body')
  }
}