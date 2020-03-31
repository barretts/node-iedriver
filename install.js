'use strict'

var fs = require('fs')
var helper = require('./lib/iedriver')
var request = require('request')
var kew = require('kew')
var npmconf = require('npmconf')
var mkdirp = require('mkdirp')
var path = require('path')
var rimraf = require('rimraf').sync
var util = require('util')
var extract = require('extract-zip')

var libPath = path.join(__dirname, 'lib', 'iedriver')
var libPath64 = path.join(__dirname, 'lib', 'iedriver64')

var baseUrl = process.env.IEDRIVER_CDNURL || process.env.npm_config_iedriver_cdnurl
  || 'https://selenium-release.storage.googleapis.com'
var downloadUrl = baseUrl + '/%s/IEDriverServer_Win32_%s.zip'
var downloadUrl64 = baseUrl + '/%s/IEDriverServer_x64_%s.zip'

downloadUrl = util.format(downloadUrl, helper.version, helper.binaryversion);
downloadUrl64 = util.format(downloadUrl64, helper.version, helper.binaryversion);

var fileName = util.format('IEDriverServer_Win32_%s.zip', helper.binaryversion);
var fileName64 = util.format('IEDriverServer_x64_%s.zip', helper.binaryversion);

var promise = kew.resolve(true)
promise = promise
  .then(function () {
    console.log('');
    console.log('Downloading 64 bit Windows IE driver server');
    console.log('-----');
    return downloadDriver(downloadUrl64, fileName64, helper.md564, libPath64, 'iedriver64');
  })
  .then(function () {
    console.log('');
    console.log('Downloading 32 bit Windows IE driver server');
    console.log('-----');
    return downloadDriver(downloadUrl, fileName, helper.md5, libPath, 'iedriver');
  });

function downloadDriver(_downloadUrl, _fileName, _md5, _libPath, _driverTmpDirName) {
  var deferred = kew.defer();

  npmconf.load(function (err, conf) {
    if (err) {
      console.log('Error loading npm config')
      console.error(err)
      process.exit(1)
      return
    }

    var tmpPath = findSuitableTempDirectory(conf, _driverTmpDirName)
    //console.log("tmp path", tmpPath);
    var downloadedFile = path.join(tmpPath, _fileName)


    // Start the install.
    var downloadPromise = requestBinary(_downloadUrl, downloadedFile)
      
    var extractPromise = downloadPromise.then(function () {
      return extractDownload(downloadedFile, tmpPath)
        .fail(function (err) {
          console.error('Error extracting ' + downloadedFile, err, err.stack);
        });
    });

    var copyPromise = extractPromise.then(function () {
      console.log('copying ' + tmpPath + ' to ' + _libPath);
      return copyIntoPlace(tmpPath, _libPath)
    });

    kew.all(downloadPromise, extractPromise, copyPromise)
      .then(function () {
        console.log('Success! IEDriverServer binary available at', _libPath + "\\IEDriverServer.exe");
        deferred.resolve(true);
      })
      .fail(function (err) {
        console.error('iedriver installation failed', err, err.stack);
        process.exit(1);
      })
  });

  return deferred.promise;
}

function findSuitableTempDirectory(npmConf, driverDir) {
  var now = Date.now()
  var candidateTmpDirs = [
    process.env.TMPDIR || './tmp',
    npmConf.get('tmp'),
    path.join(process.cwd(), 'tmp')
  ]

  for (var i = 0; i < candidateTmpDirs.length; i++) {
    var candidatePath = path.join(candidateTmpDirs[i], driverDir)

    try {
      mkdirp.sync(candidatePath, '0777')
      var testFile = path.join(candidatePath, now + '.tmp')
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      rimraf(candidatePath);
      mkdirp.sync(candidatePath, '0777')
      return candidatePath
    } catch (e) {
      console.log(candidatePath, 'is not writable:', e.message)
    }
  }

  console.error('Can not find a writable tmp directory, please report issue on https://github.com/barretts/iedriver/issues/ with as much information as possible.');
  process.exit(1);
}

function requestBinary(_downloadUrl, filePath) {
  console.log('Downloading', _downloadUrl)
  
  var deferred = kew.defer()

  const requestOptions = getRequestOptions(_downloadUrl)
  const client = request(requestOptions)        

  client
    .on('error', function (err) {
      deferred.reject('Error with http request: ' + util.inspect(err))
    })
    .on('end', function () {
      deferred.resolve(true)
    })
    .pipe(fs.createWriteStream(filePath))

  return deferred.promise
}

function getRequestOptions(_downloadUrl) {
  const options = {uri: _downloadUrl, method: 'GET'};
  const proxyUrl =  process.env.npm_config_https_proxy || process.env.npm_config_proxy || process.env.npm_config_http_proxy;
  if (proxyUrl) {
    options.proxy = proxyUrl;
  }
  return options;
}

function extractDownload(filePath, tmpPath) {
  var deferred = kew.defer()
  var options = { dir: fs.realpathSync(tmpPath) }

  try {
    extract(filePath, options, function (err) {
      if (err) {
        console.error(err)
        deferred.reject('Error extracting archive ' + err.stack)
      }
      else {
        console.log(filePath + ' extracted to ' + tmpPath)
        deferred.resolve(true)
      }
    });


  } catch (err) {
    deferred.reject('Error extracting archive ' + err.stack)
  }
  return deferred.promise
}


function copyIntoPlace(tmpPath, targetPath) {
  rimraf(targetPath);
  //console.log("Copying to target path", targetPath, "from", tmpPath);
  fs.mkdirSync(targetPath);

  // Look for the extracted directory, so we can rename it.
  var files = fs.readdirSync(tmpPath);
  var promises = files.map(function (name) {
    var deferred = kew.defer();

    var file = path.join(tmpPath, name);
    var reader = fs.createReadStream(file);

    var targetFile = path.join(targetPath, name);
    var writer = fs.createWriteStream(targetFile);
    writer.on("close", function () {
      //console.log("copied", name);
      deferred.resolve(true);
    });

    reader.pipe(writer);
    return deferred.promise;
  });

  return kew.all(promises);
}
