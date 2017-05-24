var path = require('path');
process.env.PATH += path.delimiter + path.join(__dirname, 'iedriver');
exports.path = process.arch === 'ia32' ?
path.join(__dirname, 'iedriver', 'IEDriverServer.exe') :
path.join(__dirname, 'iedriver64', 'IEDriverServer.exe');
exports.binaryversion = '3.4.0';
exports.version = '3.4';
exports.start = function(args) {
  exports.defaultInstance = require('child_process').execFile(exports.path, args);
  return exports.defaultInstance;
};
exports.stop = function () {
  if (exports.defaultInstance !== null){
    exports.defaultInstance.kill();
  }
};
exports.md5 = 'e63776eb2765f2544ff59d65bc7bf2b4';
exports.md564 = '62da5a1dad57eb7b8257a8b6229481fa';
