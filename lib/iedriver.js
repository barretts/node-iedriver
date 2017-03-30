var path = require('path');
process.env.PATH += path.delimiter + path.join(__dirname, 'iedriver');
exports.path = process.arch === 'ia32' ?
path.join(__dirname, 'iedriver', 'IEDriverServer.exe') :
path.join(__dirname, 'iedriver', 'IEDriverServer64.exe');
exports.binaryversion = '3.3.0';
exports.version = '3.3';
exports.start = function(args) {
  exports.defaultInstance = require('child_process').execFile(exports.path, args);
  return exports.defaultInstance;
};
exports.stop = function () {
  if (exports.defaultInstance !== null){
    exports.defaultInstance.kill();
  }
};
exports.md5 = '29fca76218a9421442d64d615909ccd1';
exports.md564 = 'ab4fd11857e20b90588ccbf34f9061c4';
