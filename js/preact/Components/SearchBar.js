class SearchBar extends Component
{
  constructor()
  {
    super();
    this.state.value = '';
  }

  componentWillMount()
  {
    this.onchange = this.props.onchange || (() => {});
  }

  onKeyUp(e)
  {
    let value = e.target.value;
    this.setState({value});
    this.onchange(value);
  }

  clear()
  {
    this.setState({value: ''});
    this.onchange('');
  }

  render(props)
  {
    return (

      h('search-bar', null,
        h('input', {type: 'text', value: this.state.value, onkeyup: this.onKeyUp.bind(this), placeholder: props.placeholder}),
        h('div', {onclick: this.clear.bind(this), style: {display: this.state.value.length ? 'block' : 'none'}})
      )
    );
  }
}