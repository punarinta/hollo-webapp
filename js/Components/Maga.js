class Maga extends Component
{
  render(props)
  {
    let data =
    {
        a:
        [
          'https://www.sj.se/etc/designs/sj/sites/sjse/clientlib/img/favicon.ico',
          'SJ',
          'https://i.imgur.com/EtOj4rX.jpg',
          'Så reste ni i Stockholm',
          'Today 20:00'
        ],
        b:
        [
          'https://s3-us-west-2.amazonaws.com/ntcpublic/icon-16.png',
          'Next Thing Co',
          'https://i.imgur.com/rKtkOGM.jpg',
          'You’re invited to the Next Thing Co',
          '05.02 13:37'
        ],
        c:
        [
          'https://www.avanza.se/jmvc/avanzabank/images/favicon.ico',
          'Avanza',
          'https://i.imgur.com/bv9bfLg.jpg',
          'Äntligen har vi blivit en "Storbank!"',
          '31.01 14:48'
        ]
    };

    return (

      h('maga', null,
        h('header', null,
          h('img', {src: data[props.type][0]}),
          h('name', null, data[props.type][1])
        ),
        h('thumbnail', {style: {backgroundImage: 'url("' + data[props.type][2] + '")'}}),
        h('footer', null,
          h('caption', null, data[props.type][3]),
          h('ts', null, data[props.type][4])
        )
      )
    )
  }
}
