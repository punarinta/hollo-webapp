class BottomBar extends Component
{
  render(props)
  {
    return (

      h('bottom-bar', null,
        props.children
      )
    );
  }
}