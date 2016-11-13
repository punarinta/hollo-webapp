class CustomBoxModal extends Component
{
  render()
  {
    if (!this.props.data) return h('custom-box-modal', {style: {display: 'none'}});

    return h('custom-box-modal', {className: this.props.data.className, onclick: this.props.onclose},
      h('div', null, this.props.data.children)
    );
  }
}