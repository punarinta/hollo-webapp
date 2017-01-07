class CustomBoxModal extends Component
{
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