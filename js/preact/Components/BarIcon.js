class BarIcon extends Component
{
  render(props)
  {
    return (

      h('bar-icon', {onclick: this.props.onclick},
        h('svg', {style: {backgroundImage: `url('/gfx/${props.img}')`, width: props.width, height: props.height }}),
        h('div', null,
          props.caption
        )
      )
    );
  }
}