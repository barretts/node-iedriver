var path = require('path');
exports.path = process.platform === 'win32' ? path.join(__dirname, 'iedriver', 'IEDriverServer.exe') : path.join(__dirname, 'iedriver', 'iedriver');
exports.version = '2.48';
exports.start = function() {
  exports.defaultInstance = require('child_process').execFile(exports.path);
  return exports.defaultInstance;
};
exports.stop = function () {
  if (exports.defaultInstance !== null){
    exports.defaultInstance.kill();
  }
};
exports.md5 = 'f7b8b07393e31d05ab360a06f51b482a';
