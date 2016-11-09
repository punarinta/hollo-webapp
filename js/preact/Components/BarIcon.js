class BarIcon extends Component
{
  render(props)
  {
    let caption = props.caption ? h('div', null, props.caption) : null;

    return (

      h('bar-icon', {onclick: this.props.onclick},
        h('svg', {style: {backgroundImage: `url('/gfx/${props.img}.svg')`, width: props.width, height: props.height }}),
        caption
      )
    );
  }
}