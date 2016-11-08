class DemoBoxModal extends Component
{
  render()
  {
    let data = this.props.data,
        url = `/api/file?method=download&messageId=${data.messageId}&offset=${data.offset}`;

    return h('demo-box-modal', null,
      h('div', null,
        h('div', {className: 'head'},
          h('div', null,
            ''
          ),
          h('div', {className: 'close', onclick: this.props.onclose},
            ''
          )
        ),
        h('div', {className: 'img', style: {background: `transparent url(${url}) no-repeat center`}},
          ''
        ),
        h('div', {className: 'bar'},
          h('div', {className: 'name'},
            data.file.name
          ),
          h('div', {className: 'delete', style: {display: data.canDelete ? 'flex' : 'none'}, onclick: this.props.ondelete})
        )
      )
    );
  }
}