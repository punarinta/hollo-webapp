class LoadingPage extends Component
{
  render()
  {
    return (

      h(
        'app-loader', null,
        h(
          'div', {id: 'page-loader', className: 'page fullhide'},
          h('img', {className: 'logo', src: '/gfx/white/logo.svg'}),
          h(WavyLoader)
        )
      )
    );
  }
}