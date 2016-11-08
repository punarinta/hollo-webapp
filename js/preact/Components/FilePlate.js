class FilePlate extends Component
{
  render()
  {
    let file = this.props.file,
        size = this.props.size || '72px',
        nc = file.type.split('/')[1].substring(0, 8);

    let style =
    {
      backgroundColor: ML.colorHash(file.type),
      width: size,
      minWidth: size,
      height: size
    };

    return (

      h('file-plate', {style, onclick: () => this.props.onclick(file, this.props.offset)},
        nc
      )
    );
  }
}