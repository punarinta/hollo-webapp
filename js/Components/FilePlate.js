class FilePlate extends Component
{
  render()
  {
    let file = this.props.file,
        size = this.props.size || '72px',
        nc = file.type.split('/')[1];

    let style =
    {
      backgroundColor: ML.colorHash(file.type),
      width: size,
      minWidth: size,
      height: size
    };

    if (nc.length > 6)
    {
      if (nc.length > 27) nc = nc.substring(0, 27) + '…';

      let a = [];
      style.fontSize = '80%';

      do
      {
        a.push(nc.substring(0, 7));
        a.push(h('br'));
      } while ((nc = nc.substring(7, nc.length)) != '');
      nc = a;
    }

    if (file.type.match('image.*') && file.b64)
    {
      style.background = `url("data:${file.b64}")`;
      nc = '';
    }

    return (

      h('file-plate', {style, onclick: () => this.props.onclick(file, this.props.offset)},
        nc
      )
    );
  }
}