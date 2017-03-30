var path = require('path');
process.env.PATH += path.delimiter + path.join(__dirname, 'iedriver');
exports.path = process.arch === 'ia32' ?
path.join(__dirname, 'iedriver', 'IEDriverServer.exe') :
path.join(__dirname, 'iedriver', 'IEDriverServer64.exe');
exports.binaryversion = '3.1.0';
exports.version = '3.1';
exports.start = function(args) {
  exports.defaultInstance = require('child_process').execFile(exports.path, args);
  return exports.defaultInstance;
};
exports.stop = function () {
  if (exports.defaultInstance !== null){
    exports.defaultInstance.kill();
  }
};
exports.md5 = 'd2fd01194c6fe38d2e083889d4ce7448';
exports.md564 = 'c8b8b4945858039a4d538208c9ab41a5';
