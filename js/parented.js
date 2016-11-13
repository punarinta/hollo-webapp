//  MUST BE IN ES5

var parented =
{
  fcmNotification: function (data)
  {
    console.log('Firebase message:', data);
    ML.emit('firebase', data);
  }
};