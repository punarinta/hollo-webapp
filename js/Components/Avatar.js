class Avatar extends Component
{
  constructor()
  {
    super();
    this.state.nothing = 0;
  }

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
    let chat = props.chat || {users: [props.user], read: 1},
        email = chat.users[0].email, size = props.size || '40px';

    if (chat.users.length < 2)
    {
      let stored = A.get(email);

      if (stored)
      {
        if (stored.url) this.setState({nc: '', bgImage: `url('${stored.url}')`});
        else this.setState({nc: ML.xname(chat)[1], bgImage: '', size});
      }
      else
      {
        let im = new Image, avaPath = 'https://app.hollo.email/files/avatars/' + email;
        im.onload = () =>
        {
          // great success, but don't forget to save it
          A.set(email, avaPath);
          this.setState({nc: '', bgImage: `url('${avaPath}')`});
        };
        im.onerror = () =>
        {
          // try loading Gravatar if Gmail avatar failed
          Gravatar.load(email, d =>
          {
            if (d)
            {
              let url = `${d.thumbnailUrl}?s=${size}`;
              A.set(email, url);
              this.setState({nc: '', bgImage: `url(${url})`});
            }
            else
            {
              A.set(email, null);
              this.setState({nc: ML.xname(chat)[1], bgImage: '', size});
            }
          });
        };
        im.src = avaPath;
      }
    }
    else
    {
      // a chat -> no avatar
      this.setState({nc: ML.xname(chat)[1], bgImage: '', size});
    }
  }

  render(props)
  {
    let chat = props.chat || {users: [props.user], read: 1},
        size = props.size || '40px',
        email = chat.users[0] ? chat.users[0].email : '',
        style =
        {
          backgroundImage: this.state.bgImage,
          width: size,
          minWidth: size,
          height: size
        };

    if (CFG.colorAvatars) style.backgroundColor = ML.colorHash(email);

    return (

      h('avatar', {className: chat.read ? '' : 'unread', style, onclick: this.props.onclick},
        this.state.nc
      )
    );
  }
}