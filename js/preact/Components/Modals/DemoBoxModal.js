class DemoBoxModal extends Component
{
  render()
  {
    let url = `/api/file?method=download&messageId=${this.props.data[0]}&offset=${this.props.data[0]}`;

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
        h('div', {className: 'bar', style: {display: this.props.canDelete ? 'flex' : 'none'}},
          h('div', {className: 'name'},
            ''
          ),
          h('div', {className: 'delete', onclick: this.props.ondelete})
        )
      )
    );
  }
}