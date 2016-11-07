class Avatar extends Component
{
  componentWillMount()
  {
    this.loadGraphics(this.props);
  }

  componentWillReceiveProps(nextProps)
  {
    this.loadGraphics(nextProps);
  }

  loadGraphics(props)
  {
    let chat = props.chat,
        email = chat.users[0].email;

    this.setState(
    {
      nc: ML.xname(chat)[1],
      bgImage: '',
      size: props.size || '48px'
    });

    if (chat.users.length < 2)
    {
      let im = new Image;
      im.onload = () =>
      {
        this.setState({nc: '', bgImage: `url('/files/avatars/${email}')`});
      };
      im.onerror = () =>
      {
        // try loading Gravatar if Gmail avatar failed
        ML.grava(chat.users[0].email, d =>
        {
          if (d)
          {
            this.setState({nc: '', bgImage: `url(${d.thumbnailUrl}?s=${this.state.size})`});
          }
        });
      };
      im.src = '/files/avatars/' + email;
    }
  }

  render(props)
  {
    let chat = props.chat,
        size = this.state.size,
        email = chat.users[0].email,
        style =
        {
          backgroundColor: ML.colorHash(email),
          backgroundImage: this.state.bgImage,
          width: size,
          minWidth: size,
          height: size
        };

    return (

      h('avatar', {className: chat.read ? '' : 'unread', style, onclick: this.props.onclick},
        this.state.nc
      )
    );
  }
}