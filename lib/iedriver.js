var path = require('path');
process.env.PATH += path.delimiter + path.join(__dirname, 'iedriver');
exports.path = process.platform === 'win32' ?
  path.join(__dirname, 'iedriver', 'IEDriverServer.exe') :
  path.join(__dirname, 'iedriver', 'IEDriverServer64.exe');
exports.binaryversion = '2.53.1'
exports.version = '2.53';
exports.start = function(args) {
  exports.defaultInstance = require('child_process').execFile(exports.path, args);
  return exports.defaultInstance;
};
exports.stop = function () {
  if (exports.defaultInstance !== null){
    exports.defaultInstance.kill();
  }
};
exports.md5 = '35ac005f9088f2995d6a1cdc384fe4cb';
exports.md564 = '6c822788a04e4e8d4727dc4c08c0102a';
