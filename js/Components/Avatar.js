class Avatar extends Component
{
  constructor()
  {
    super();
    this.empty = [];
  }

  componentWillMount()
  {
    this.loadGraphics(this.props);
  }

  componentWillReceiveProps(nextProps)
  {
    if (this.props.user != nextProps.user)
    {
      this.setState({bgImage: null})
    }
    this.loadGraphics(nextProps);
  }

  loadGraphics(props)
  {
    let chat = props.chat || {users: [props.user], read: 1},
        email = chat.users[0].email;

    this.setState(
    {
      nc: ML.xname(chat)[1],
      bgImage: '',
      size: props.size || '48px'
    });

    if (this.empty.indexOf(email) != -1)
    {
      return;
    }

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
        Gravatar.load(email, d =>
        {
          if (d)
          {
            this.setState({nc: '', bgImage: `url(${d.thumbnailUrl}?s=${this.state.size})`});
          }
          else
          {
            this.empty.push(email);
          }
        });
      };
      im.src = '/files/avatars/' + email;
    }
  }

  render(props)
  {
    let chat = props.chat || {users: [props.user], read: 1},
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