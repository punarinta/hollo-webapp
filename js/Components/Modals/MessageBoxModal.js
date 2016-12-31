class MessageBoxModal extends Component
{
  onClick(code)
  {
    let payload = null;

    if (typeof this.props.data.input != 'undefined') payload = this.base.querySelector('input').value;

    if (typeof this.props.data.cb == 'function') this.props.data.cb(code, payload);
    if (typeof this.props.onclose == 'function') this.props.onclose()
  }

  render(props)
  {
    let data = props.data;
    if (!data)
    {
      return h('message-box-modal', {style: {display: 'none'}});
    }

    let buttons = [h('button', {className: 'btn ok', onclick: () => this.onClick(1)}, 'OK')];

    if (data.type == 1)
    {
      buttons.push(h('button', {className: 'btn cancel', onclick: () => this.onClick(0)}, 'Cancel'))
    }

    return h('message-box-modal', {onclick: (e) => {if (e.target.nodeName.toLowerCase() == 'message-box-modal') this.onClick(0)} },
      h('div', null,
        h(MessageBody, {html: data.html}),
        typeof data.input == 'undefined' ? '' : h('input',
        {
          value: data.input,
          type: 'text',
          autofocus: 'autofocus'
        }),
        h('div', {className: 'foot'},
          buttons
        )
      )
    );
  }
}