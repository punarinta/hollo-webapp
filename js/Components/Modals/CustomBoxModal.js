class CustomBoxModal extends Component
{
  componentDidMount()
  {
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyUp(e)
  {
    if (this.props.data && e.keyCode == 27) ML.emit('custombox')
  }

  render(props)
  {
    if (!props.data)
    {
      return h('custom-box-modal', {style: {display: 'none'}})
    }

    return h('custom-box-modal', {className: props.data.className, onclick: props.data.onclick ? props.data.onclick : props.onclose},
      h('div', null, props.data.children)
    );
  }
}