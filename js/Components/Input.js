class Input extends Component
{
  render(props)
  {
    props.onfocus = (e) =>
    {
      if (this.props.onfocusx) this.props.onfocusx(e);
      parent.postMessage({cmd: 'statusBar', flag: 1}, '*');
    };
    props.onblur = (e) =>
    {
      if (this.props.onblurx) this.props.onblurx(e);
      parent.postMessage({cmd: 'statusBar'}, '*');
    };

    return h('input', props)
  }
}