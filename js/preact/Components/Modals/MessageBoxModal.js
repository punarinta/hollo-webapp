class MessageBoxModal extends Component
{
  onClick()
  {
    if (typeof this.props.data.cb == 'function') this.props.data.cb();
    if (typeof this.props.onclose == 'function') this.props.onclose()
  }

  render()
  {
    let data = this.props.data,
        buttons = [h('button', {className: 'btn ok', onclick: this.onClick.bind(this)}, 'OK')];

    if (data.type == 1)
    {
      buttons.push(h('button', {className: 'btn cancel', onclick: this.onClick.bind(this)}, 'Cancel'))
    }

    return h('message-box-modal', null,
      h('div', null,
        h(MessageBody, {html: data.html}),
        h('div', {className: 'foot'},
          buttons
        )
      )
    );
  }
}