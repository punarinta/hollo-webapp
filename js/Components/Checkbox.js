class Checkbox extends Component
{
  constructor()
  {
    super();
    this.state.checked = 1;
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

  render()
  {
    return (

      h('checkbox', {onclick: this.onClick.bind(this)},
        h('svg', {fill: '#7a4df9', width: '24', height: '24', viewBox: '0 0 24 24'},
          h('path', {d: 'M0 0h24v24H0z', fill: 'none'}),
          h('path', {d: this.state.checked ? 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' : 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'})
        ),
        h('span', null, this.props.caption)
      )
    );
  }
}