class BarIcon extends Component
{
  onClick()
  {
    if (this.props.onclick)
    {
      this.props.onclick();
    }
  }

  render(props)
  {
    return (

      h('bar-icon', {onclick: this.onClick.bind(this)},
        h('svg', {style: {backgroundImage: `url('/gfx/${props.img}')`, width: props.width, height: props.height }}),
        h('div', null,
          props.caption
        )
      )
    );
  }
}