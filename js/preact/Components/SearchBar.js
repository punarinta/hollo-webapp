class SearchBar extends Component
{
  constructor()
  {
    super();
    this.state.value = '';
    this.state.focus = 0;
  }

  componentWillMount()
  {
    this.onchange = this.props.onchange || (() => {});
    this.onfocuschange = this.props.onfocuschange || (() => {});
  }

  onKeyUp(e)
  {
    let value = e.target.value;
    this.setState({value});
    this.onchange(value);
  }

  onFocus()
  {
    this.setState({focus: 1});
    this.onfocuschange(1)
  }

  onBlur()
  {
    this.setState({focus: 0});
    this.onfocuschange(0)
  }

  clear()
  {
    this.setState({value: ''});
    this.onchange('');
  }

  render(props)
  {
    return (

      h('search-bar', {className: this.props.className},
        h('input',
        {
          type: 'text',
          value: this.state.value,
          onkeyup: this.onKeyUp.bind(this),
          onfocus: this.onFocus.bind(this),
          onblur: this.onBlur.bind(this),
          placeholder: props.placeholder
        }),
        h('div', {onclick: this.clear.bind(this), style: {display: this.state.focus ? 'block' : 'none'}})
      )
    );
  }
}