var path = require('path');
process.env.PATH += path.delimiter + path.join(__dirname, 'iedriver');
exports.path = process.arch === 'ia32' ?
path.join(__dirname, 'iedriver', 'IEDriverServer.exe') :
path.join(__dirname, 'iedriver', 'IEDriverServer64.exe');
exports.binaryversion = '3.2.0';
exports.version = '3.2';
exports.start = function(args) {
  exports.defaultInstance = require('child_process').execFile(exports.path, args);
  return exports.defaultInstance;
};
exports.stop = function () {
  if (exports.defaultInstance !== null){
    exports.defaultInstance.kill();
  }
};
exports.md5 = '0ec0ef4685fca7382bd47921f6c4a1e5';
exports.md564 = 'c9fd963a071e8744314da8c56e1ec4f4';
