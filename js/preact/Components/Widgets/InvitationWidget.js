class InvitationWidget extends Component
{
  render(props)
  {
    let w = this.props.data;

    let org = w.org[1] || w.org[0],
      when = ML.ts(w.from) + ' – ' + ML.ts(w.to, 2),
      url = w.descr.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig),
      atts = [];

    for (let j = 0; j < w.att.length; j++)
    {
      if (atts.length == 3)
      {
        atts.push('...');
        break;
      }
      let toAdd = w.att[j][1].length ? w.att[j][1] : w.att[j][0];
      if (toAdd != org) atts.push(toAdd)
    }

    return (

      h('invitation-widget', {className: 'event'},
        h('div', {className: 'b when'},
          h('icon', null),
          h('div', null,
            h('div', null,
              'When'
            ),
            h('div', null,
              when
            )
          )
        ),
        h('div', {className: 'people'},
          h('div', {className: 'b org'},
            h('icon', null),
            h('div', null,
              h('div', null,
                'Organizer'
              ),
              h('div', null,
                org
              )
            )
          ),
          h('div', {className: 'b att'},
            h('icon', null),
            h('div', null,
              h('div', null,
                'Invitees'
              ),
              h('div', null,
                atts
              )
            )
          )
        ),
        url ? h('div', {className: 'open'},
          h('a', {target: '_blank', href: url},
            'Open in calendar'
          )
        ) : ''
      )
    );
  }
}