class FilePlate extends Component
{
  onClick()
  {
    // show a preview
  }

  render()
  {
    let size = this.props.size || '72px',
        nc = this.props.file.type.split('/')[1].substring(0, 8);

    let style =
    {
      backgroundColor: ML.colorHash(this.props.file.type),
      width: size,
      minWidth: size,
      height: size
    };

    return (

      h('file-plate', {style, onclick: this.onClick.bind(this)},
        nc
      )
    );
  }
}