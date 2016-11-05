class ChatRow extends Component
{
  render(props)
  {
    let chat = props.chat,
        email = chat.users[0].email,
        lastMsg = chat.last.msg || '';

    if (lastMsg.charAt(0) == '{')
    {
      // for now we only support calendar invites
      lastMsg = '📅 ' + JSON.parse(lastMsg).widget.title;
    }
    else
    {
      lastMsg = lastMsg.replace(/\[sys:fwd\]/g, ' ➡️ ' + chat.last.subj).replace(/(<([^>]+)>)/ig, '').substring(0, 60).trim();
    }

    return (

      h('chat-row', null,
        h('div', null,
          h(Avatar, {chat}),
          h('div', {className: 'info'},
            h('div', {className: 'name'},
              ML.xname(chat)[0]
            ),
            h('div', {className: 'email'},
              lastMsg || '&mdash;'
            )
          )
        ),
        h('div', {className: 'shadow'},
          h('div', null,
            `${chat.muted ? 'un' : ''}mute`
          ),
          h('div', {className: 'markas'},
            `mark\nas ${chat.read ? '' : 'un'}read`
          )
        )
      )
    );
  }
}