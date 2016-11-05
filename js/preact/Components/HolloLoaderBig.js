class HolloLoaderBig extends Component
{
  render()
  {
    const items = [1,2,3,4,5].map( () =>
    (
      h('span')
    ));

    return (

      h(
        'hollo-loader-big', null,
        items
      )
    );
  }
}