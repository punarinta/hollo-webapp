class MessageBoxModal extends Component
{
  componentDidMount()
  {
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyUp(e)
  {
    if (this.props.data && e.keyCode == 27) ML.emit('messagebox')
  }

  onClick(code)
  {
    let payload = null, p = this.props;

    if (typeof p.data.input != 'undefined') payload = this.base.querySelector('input').value;
    else if (typeof p.data.text != 'undefined') payload = this.base.querySelector('textarea').value;

    if (typeof p.data.cb == 'function') p.data.cb(code, payload);
    if (typeof p.onclose == 'function') p.onclose()
  }

  componentDidUpdate()
  {
    let data = this.props.data, f = null;
    if (data)
    {
      if (data.input)
      {
        f = this.base.querySelector('input');
        f.focus();
        f.value = data.input;
      }
      if (data.text)
      {
        f = this.base.querySelector('textarea');
        f.focus();
        f.value = data.text;
      }
    }
  }

  render(props)
  {
    let data = props.data;
    if (!data)
    {
      return h('message-box-modal', {style: {display: 'none'}});
    }

    let buttons = [h('button', {className: 'btn ok', onclick: () => this.onClick(1)}, _('BTN_OK'))];

    if (data.type == 1)
    {
      buttons.push(h('button', {className: 'btn cancel', onclick: () => this.onClick(0)}, _('BTN_CANCEL')))
    }

    return h('message-box-modal', {onclick: (e) => {if (e.target.nodeName.toLowerCase() == 'message-box-modal') this.onClick(0)} },
      h('div', null,
        data.html ? h(MessageBody, {html: data.html}) : '',
        typeof data.input == 'undefined' ? '' : h('input',
        {
          value: data.input,
          type: 'text'
        }),
        typeof data.text == 'undefined' ? '' : h('textarea', null, data.text),
        h('div', {className: 'foot'},
          buttons
        )
      )
    );
  }
}