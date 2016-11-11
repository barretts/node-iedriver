var path = require('path');
process.env.PATH += path.delimiter + path.join(__dirname, 'iedriver');
exports.path = process.platform === 'win32' ?
path.join(__dirname, 'iedriver', 'IEDriverServer.exe') :
path.join(__dirname, 'iedriver', 'IEDriverServer64.exe');
exports.binaryversion = '3.0.0';
exports.version = '3.0';
exports.start = function(args) {
  exports.defaultInstance = require('child_process').execFile(exports.path, args);
  return exports.defaultInstance;
};
exports.stop = function () {
  if (exports.defaultInstance !== null){
    exports.defaultInstance.kill();
  }
};
exports.md5 = '4ba666e144f07869a0aa5f7a4c7a2091';
exports.md564 = '4396e6ca7fe643ef49ee137a81723a42';
