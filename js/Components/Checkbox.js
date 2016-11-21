class Checkbox extends Component
{
  constructor()
  {
    super();
    this.state.checked = 1;
  }

  componentWillMount()
  {
    this.state.checked = this.props.checked
  }

  onClick()
  {
    let checked = !this.state.checked;
    this.setState({checked});
    if (typeof this.props.onchange == 'function')
    {
      this.props.onchange(checked)
    }
  }

  render(props)
  {
    return h('checkbox', { onclick: this.onClick.bind(this) },
      h(Svg, {model: this.state.checked ? 'checked' : 'unchecked'}),
      h('span', null, props.caption)
    );
  }
}