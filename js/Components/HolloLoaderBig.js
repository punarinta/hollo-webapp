class HolloLoaderBig extends Component
{
  render(props)
  {
    let style = {};
    if (props.color) style.backgroundColor = props.color;

    const items = [1,2,3,4,5].map( () =>
    (
      h('span', {style: style})
    ));

    return (

      h(
        'hollo-loader-big', null,
        items
      )
    );
  }
}