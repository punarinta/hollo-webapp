class MessageBoxModal extends Component
{
  componentDidMount()
  {
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('hollo:messagebox', (e) => this.setState({data: e.payload}) );
  }

  onKeyUp(e)
  {
    if (this.state.data)
    {
      if (e.keyCode == 27) { this.onClick(0); this.close() }
      if (e.keyCode == 13) this.onClick(1)
    }
  }

  onClick(code)
  {
    let payload = null, data = this.state.data;

    if (typeof data.input != 'undefined') payload = this.base.querySelector('input').value;
    else if (typeof data.text != 'undefined') payload = this.base.querySelector('textarea').value;

    if (typeof data.cb == 'function') data.cb(code, payload);
    this.close();
  }

  close()
  {
    this.setState({data: 0})
  }

  componentDidUpdate()
  {
    let data = this.state.data, f = null;

    if (data)
    {
      if (typeof data.input == 'string')
      {
        f = document.querySelector('message-box-modal input');
        f.focus();
        f.value = data.input;
      }
      if (typeof data.text == 'string')
      {
        f = this.base.querySelector('textarea');
        f.focus();
        f.value = data.text;
      }
    }
  }

  render()
  {
    let data = this.state.data;

    if (!data)
    {
      return h('message-box-modal', {style: {display: 'none'}});
    }

    let buttons = [ h('button', {className: 'btn ok', onclick: () => this.onClick(1)}, _('BTN_OK')) ];

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