'use strict'

var AdmZip = require('adm-zip')
var cp = require('child_process')
var fs = require('fs')
var helper = require('./lib/iedriver')
var http = require('https')
var kew = require('kew')
var npmconf = require('npmconf')
var mkdirp = require('mkdirp')
var path = require('path')
var rimraf = require('rimraf').sync
var url = require('url')
var util = require('util')
var md5file = require('md5-file')

var libPath = path.join(__dirname, 'lib', 'iedriver')
var libPath64 = path.join(__dirname, 'lib', 'iedriver64')
var downloadUrl = 'https://selenium-release.storage.googleapis.com/%s/IEDriverServer_Win32_%s.zip'
var downloadUrl64 = 'https://selenium-release.storage.googleapis.com/%s/IEDriverServer_x64_%s.zip'

downloadUrl = util.format(downloadUrl, helper.version, helper.binaryversion);
downloadUrl64 = util.format(downloadUrl64, helper.version, helper.binaryversion);

var fileName = util.format('IEDriverServer_Win32_%s.zip', helper.binaryversion);
var fileName64 = util.format('IEDriverServer_x64_%s.zip', helper.binaryversion);

var promise = kew.resolve(true)
promise = promise
  .then(function() {
    console.log('');
    console.log('Downloading 64 bit Windows IE driver server');
    console.log('-----');
    return downloadDriver(downloadUrl64, fileName64, helper.md564, libPath64, 'iedriver64');
  })
  .then(function() {
    console.log('');
    console.log('Downloading 32 bit Windows IE driver server');
    console.log('-----');
    return downloadDriver(downloadUrl, fileName, helper.md5, libPath, 'iedriver');
  });

function downloadDriver(_downloadUrl, _fileName, _md5, _libPath, _driverTmpDirName) {
  var deferred = kew.defer();

  npmconf.load(function(err, conf) {
    if (err) {
      console.log('Error loading npm config')
      console.error(err)
      process.exit(1)
      return
    }

    var tmpPath = findSuitableTempDirectory(conf, _driverTmpDirName)
    //console.log("tmp path", tmpPath);
    var downloadedFile = path.join(tmpPath, _fileName)
    var promise = kew.resolve(true)

    // Start the install.
    promise = promise.then(function () {
      console.log('Downloading', _downloadUrl)
      //console.log('Saving to', downloadedFile)
      return requestBinary(getRequestOptions(conf.get('proxy'), _downloadUrl), downloadedFile)
    })
    promise.then(function () {
      return validateMd5(downloadedFile, _md5)
    })
    promise.then(function () {
      return extractDownload(downloadedFile, tmpPath)
    })
    promise.then(function () {
      return copyIntoPlace(tmpPath, _libPath)
    })
    promise.then(function () {
      console.log('Success! IEDriverServer binary available at', _libPath+"\\IEDriverServer.exe");
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
    process.env.TMPDIR || '/tmp',
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


function getRequestOptions(proxyUrl, _downloadUrl) {
  if (proxyUrl) {
    var options = url.parse(proxyUrl)
    options.path = _downloadUrl
    options.headers = { Host: url.parse(_downloadUrl).host }
    // Turn basic authorization into proxy-authorization.
    if (options.auth) {
      options.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(options.auth).toString('base64')
      delete options.auth
    }

    return options
  } else {
    return url.parse(_downloadUrl)
  }
}


function requestBinary(requestOptions, filePath) {
  var deferred = kew.defer()

  var count = 0
  var notifiedCount = 0
  var outFile = fs.openSync(filePath, 'w')

  var client = http.get(requestOptions, function (response) {
    var status = response.statusCode
    console.log('Receiving...')

    if (status === 200) {
      response.addListener('data',   function (data) {
        fs.writeSync(outFile, data, 0, data.length, null)
        count += data.length
        if ((count - notifiedCount) > 800000) {
          console.log('Received ' + Math.floor(count / 1024) + 'K...')
          notifiedCount = count
        }
      })

      response.addListener('end',   function () {
        console.log('Received ' + Math.floor(count / 1024) + 'K total.')
        fs.closeSync(outFile)
        deferred.resolve(true)
      })

    } else {
      client.abort()
      deferred.reject('Error with http request: ' + util.inspect(response.headers))
    }
  })

  return deferred.promise
}


function validateMd5(filePath, md5value) {
  var deferred = kew.defer()

  console.log('Expecting archive MD5 hash of', md5value);
  var md5fileValue = md5file(filePath).toLowerCase();
  console.log('          archive MD5 hash is', md5fileValue);
  //console.log('Validating MD5 checksum of file ' + filePath)

  try {
    if (md5fileValue == md5value.toLowerCase()) {
      deferred.resolve(true)
    } else {
      deferred.reject('Error archive md5 checksum does not match')
    }
  } catch (err) {
    deferred.reject('Error trying to match md5 checksum')
  }

  return deferred.promise
}


function extractDownload(filePath, tmpPath) {
  var deferred = kew.defer()
  var options = {cwd: tmpPath}

  //console.log('Extracting zip contents')
  try {
    var zip = new AdmZip(filePath)
    zip.extractAllTo(tmpPath, true)
    deferred.resolve(true)
  } catch (err) {
    deferred.reject('Error extracting archive ' + err.stack)
  }
  return deferred.promise
}

function rmDir(dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  fs.rmdirSync(dirPath);
};


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
    writer.on("close", function() {
      //console.log("copied", name);
      deferred.resolve(true);
    });

    reader.pipe(writer);
    return deferred.promise;
  });

  return kew.all(promises);
}
