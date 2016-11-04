class App extends Component
{
  constructor()
  {
    super();
    this.state.page = 'loading';
  }

  componentDidMount()
  {
    // update time every second
    this.timer = setTimeout(() =>
    {
      this.setState({ page: 'login' });
    }, 1000);
  }

  render()
  {
    // place here the logic of page switching
    let page = this.state.page == 'loading' ? h(LoadingPage) : h(LoginPage);

    return (

      h(
        'div', { id: 'app' },
        page
      )
    );
  }
}

render(h(App), document.body);