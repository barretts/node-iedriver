var path = require('path');
exports.path = process.platform === 'win32' ? path.join(__dirname, 'iedriver', 'IEDriverServer.exe') : path.join(__dirname, 'iedriver', 'iedriver');
exports.version = '2.47';
exports.start = function() {
  exports.defaultInstance = require('child_process').execFile(exports.path);
  return exports.defaultInstance;
}
exports.stop = function () {
  if (exports.defaultInstance != null){
    exports.defaultInstance.kill();
  }
}
exports.md5 = '8D737F709699CC194AF303660E47DFC4'
