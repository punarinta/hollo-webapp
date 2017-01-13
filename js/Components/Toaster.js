class Toaster extends Component
{
  componentDidMount()
  {
    window.addEventListener('hollo:toast', this.toast.bind(this));
  }

  toast(e)
  {
    this.setState({toast: e.payload});

    if (e.payload)
    {
      setTimeout(() =>
      {
        ML.emit('toast');
        if (e.payload.do) e.payload.do();    // run default action
      }, 3000)
    }
  }

  render()
  {
    let toast = this.state.toast,
        style = {height: toast ? '48px' : 0};

    if (toast && typeof toast.bottom != 'undefined') style.bottom = toast.bottom;

    return (

      h('toaster', {style},
        toast ?
        [
          h('caption', null, toast.caption),
          h('button', { onclick: () => {toast.undo(); ML.emit('toast') } }, _('CAP_UNDO'))
        ] : ''
      )
    )
  }
}