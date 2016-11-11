class BarIcon extends Component
{
  render(props)
  {
    let caption = props.caption ? h('div', null, props.caption) : null;

    return (

      h('bar-icon', {className: this.props.className, onclick: this.props.onclick, style: this.props.fullHeight ? {height: props.height} : {}},
        h('svg', {style: {backgroundImage: `url('/gfx/${props.img}.svg')`, width: props.width || '20px', height: props.height || '20px' }}),
        caption
      )
    );
  }
}