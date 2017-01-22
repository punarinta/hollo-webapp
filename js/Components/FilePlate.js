class FilePlate extends Component
{
  componentDidMount()
  {
    this.getPreview(this.props)
  }

  componentWillReceiveProps(props)
  {
    this.getPreview(props)
  }

  getPreview(props)
  {
    let previewable =
    [
      'image/png',
      'image/gif',
      'image/jpg',
      'image/jpeg',
      'application/pdf',
      'image/svg+xml',
      'text/html',
      'image/tiff',
      'image/bmp',
    ];

    if (props.file && props.file.url && previewable.indexOf(props.file.type) != -1)
    {
      let im = new Image;
      im.src = props.file.url;
      im.onload = () =>
      {
        this.setState({thumbnail: props.file.url})
      };
    }
  }

  render(props)
  {
    let file = props.file,
        size = props.size || '72px',
        nc = file.type.split('/')[1];

    let style =
    {
      backgroundColor: ML.colorHash(file.type),
      width: size,
      minWidth: size,
      height: size
    };

    if (props.full)
    {
      let a = [], name = file.name ? file.name : '';

      do
      {
        a.push(name.substring(0, 10));
        a.push(h('br'));
      } while ((name = name.substring(10, name.length)) != '');

      nc =
      [
        h('caption', null, a)
      ]
    }
    else
    {
      if (nc && nc.length > 6)
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
    }

    if (this.state.thumbnail)
    {
      style.background = `url("${this.state.thumbnail}")`;
      nc = '';
    }

    return (

      h('file-plate', {style, onclick: () => props.onclick(file, props.offset)},
        nc
      )
    );
  }
}