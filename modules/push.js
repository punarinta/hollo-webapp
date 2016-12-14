'use strict';

self.addEventListener('install', function (event)
{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('push', function (event)
{
  event.waitUntil
  (
    fetch('/api/message/latest').then(function (response)
    {
      if (response.status !== 200)
      {
        console.log('Error code:', response.status);
        throw new Error();
      }

      return response.json().then(function (data)
      {
        if (data.error || !data.notification)
        {
          console.error('API error:', data.error);
          throw new Error();
        }

        return self.registration.showNotification(data.notification.title,
        {
          body: data.notification.body,
          icon: 'https://app.hollo.email/favicon/notification.png',
          data:
          {
            url: data.notification.url
          }
        });
      }).catch(function (err)
      {
        console.error('Unable to retrieve data', err);
      });
    })
  );
});

self.addEventListener('notificationclick', function (event)
{
  event.notification.close();
  var url = event.notification.data.url;
  event.waitUntil(clients.openWindow(url));
});