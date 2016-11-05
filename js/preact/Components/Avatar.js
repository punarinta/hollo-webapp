class Avatar extends Component
{
  componentWillMount()
  {
    let chat = this.props.chat,
        email = chat.users[0].email;

    this.state =
    {
      nc: ML.xname(chat)[1],
      bgImage: '',
      size: this.props.size || '48px'
    };

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
          this.setState({nc: '', bgImage: `url(${(d || {}).thumbnailUrl}?s=${this.state.size})`});
        });
      };
      im.src = '/files/avatars/' + chat.users[0].email;
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

      h('avatar', {className: chat.read ? '' : 'unread', style},
        this.state.nc
      )
    );
  }
}