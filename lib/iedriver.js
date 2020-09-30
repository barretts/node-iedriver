var path = require('path');
process.env.PATH += path.delimiter + path.join(__dirname, 'iedriver');
exports.path32 = path.join(__dirname, 'iedriver', 'IEDriverServer.exe');
exports.path64 = path.join(__dirname, 'iedriver64', 'IEDriverServer.exe');
exports.path = process.arch === 'ia32' ? exports.path32 : exports.path64;
exports.binaryversion = '3.150.1';
exports.version = '3.150';
exports.start = function(args) {
  exports.defaultInstance = require('child_process').execFile(exports.path, args);
  return exports.defaultInstance;
};
exports.stop = function () {
  if (exports.defaultInstance !== null){
    exports.defaultInstance.kill();
  }
};
exports.md5 = 'fc30ecce5279af6eb1c16c49efdd9103';
exports.md564 = 'e6ceb99ff19d06137b044d3832261239';
