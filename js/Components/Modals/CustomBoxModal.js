class CustomBoxModal extends Component
{
  componentDidMount()
  {
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('hollo:custombox', (e) => this.setState({data: e.payload}) );
  }

  onKeyUp(e)
  {
    if (this.state.data && e.keyCode == 27) this.close()
  }

  close()
  {
    this.setState({data: 0})
  }

  render()
  {
    let data = this.state.data;

    if (!data)
    {
      return h('custom-box-modal', {style: {display: 'none'}})
    }

    return h('custom-box-modal', {className: data.className, onclick: data.onclick ? data.onclick : this.close.bind(this)},
      h('div', null, data.children)
    );
  }
}