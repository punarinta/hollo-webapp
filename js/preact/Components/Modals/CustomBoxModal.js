class CustomBoxModal extends Component
{
  render()
  {
    return h('custom-box-modal', {className: this.props.data.className, onclick: this.props.onclose},
      h('div', null, this.props.data.children)
    );
  }
}