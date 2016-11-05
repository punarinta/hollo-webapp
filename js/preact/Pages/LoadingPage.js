class LoadingPage extends Component
{
  render()
  {
    return (

      h('app-loader', null,
        h('div', {style: {display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}},
          h('img', {src: '/gfx/white/logo.svg'}),
          h(HolloLoaderBig)
        )
      )
    );
  }
}