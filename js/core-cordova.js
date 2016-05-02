if (typeof window.cordova != "undefined")
{
  ML.isWeb = false;
  ML.apiRoot = 'api.hollo.email';

  var ML_cordova =
  {
    readFile: function (fileName, cb) {
      var pathToFile = cordova.file.dataDirectory + 'hollo-' + fileName;
      window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();

          reader.onloadend = function () {
            cb(this.result);
          };

          reader.readAsText(file);
        }, function () {
          cb(null);
        });
      }, function () {
        cb(null);
      });
    },

    writeToFile: function (fileName, data)
    {
      data = JSON.stringify(data, null, '\t');
      window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (directoryEntry)
      {
        directoryEntry.getFile('hollo-' + fileName, {create: true}, function (fileEntry)
        {
          fileEntry.createWriter(function (fileWriter)
          {
            fileWriter.onwriteend = function ()
            {
              // for real-world usage, you might consider passing a success callback
              console.log('Write of file "' + fileName + '"" completed.');
            };

            fileWriter.onerror = function (e)
            {
              // you could hook this up with our global error handler, or pass in an error callback
              console.log('Write failed: ' + e.toString());
            };

            var blob = new Blob([data], {type: 'text/plain'});
            fileWriter.write(blob);
          }, ML_cordova.errorHandler.bind(null, fileName));
        }, ML_cordova.errorHandler.bind(null, fileName));
      }, ML_cordova.errorHandler.bind(null, fileName));
    },

    errorHandler: function (fileName, e)
    {
      var msg = '';

      switch (e.code)
      {
        case FileError.QUOTA_EXCEEDED_ERR:
          msg = 'Storage quota exceeded';
          break;
        case FileError.NOT_FOUND_ERR:
          msg = 'File not found';
          break;
        case FileError.SECURITY_ERR:
          msg = 'Security error';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          msg = 'Invalid modification';
          break;
        case FileError.INVALID_STATE_ERR:
          msg = 'Invalid state';
          break;
        default:
          msg = 'Unknown error';
          break;
      }

      console.log('Error (' + fileName + '): ' + msg);
    }
  };
  
  ML.sessionSave = function ()
  {
    localStorage.setItem('sessionId', ML.sessionId);
    ML_cordova.writeToFile('sessionId', ML.sessionId);
  }
}
