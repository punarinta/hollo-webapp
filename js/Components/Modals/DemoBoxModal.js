class DemoBoxModal extends Component
{
  componentDidMount()
  {
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('hollo:demobox', (e) => this.setState({data: e.payload}) );
  }

  onKeyUp(e)
  {
    if (this.state.data && e.keyCode == 27) this.close();
  }

  deleteClicked()
  {
    let data = this.state.data;

    if (data.ondelete) data.ondelete(data.file);
    this.close();
  }

  close()
  {
    this.setState({data: 0})
  }

  render()
  {
    let nc, url = '', data = this.state.data, style = {display: 'none'};

    if (!data)
    {
      return h('demo-box-modal', {style});
    }

    if (data.file.type.match('image.*'))
    {
      if (data.messageId)
      {
        url = CFG.apiRoot + `file?method=download&messageId=${data.messageId}&offset=` + data.offset
      }
      else if (data.file)
      {
        url = `data:${data.file.b64}`;
      }
      nc = '';
      style = {background: `transparent url("${url}") no-repeat center`}
    }
    else
    {
      nc = data.file.type.split('/')[1].substring(0, 8);
      style = {background: ML.colorHash(data.file.type),}
    }

    return h('demo-box-modal', { onclick: this.close.bind(this) },
      h('div', null,
        h('div', {className: 'head', onclick: this.close.bind(this) },
          h(Svg, {model: 'cross', fill: '#fff', type: 'polygon', size: 14})
        ),
        h('div', {className: 'img', style},
          nc
        ),
        h('div', {className: 'bar'},
          h('div', {className: 'name'},
            data.file.name
          ),
          h('div', {className: 'delete', style: {display: data.canDelete ? 'flex' : 'none'}, onclick: this.deleteClicked.bind(this)},
            h(Svg, {model: 'delete', fill: '#fff'})
          )
        )
      )
    );
  }
}