'use strict'

var AdmZip = require('adm-zip')
var cp = require('child_process')
var fs = require('fs')
var helper = require('./lib/iedriver')
var http = require('http')
var kew = require('kew')
var npmconf = require('npmconf')
var mkdirp = require('mkdirp')
var path = require('path')
var rimraf = require('rimraf').sync
var url = require('url')
var util = require('util')
var md5file = require('md5-file')

var libPath = path.join(__dirname, 'lib', 'iedriver')

var downloadUrl = 'http://selenium-release.storage.googleapis.com/%s/IEDriverServer_x64_%s.zip'

var platform = process.platform

if (platform !== 'win32') {
  console.log('IEDriverServer only works on Windows:', process.platform, process.arch)
  process.exit(1)
}

downloadUrl = util.format(downloadUrl, helper.version, helper.binaryversion);

var fileName = util.format('IEDriverServer_Win32_%s.zip', helper.binaryversion);

npmconf.load(function(err, conf) {
  if (err) {
    console.log('Error loading npm config')
    console.error(err)
    process.exit(1)
    return
  }

  var tmpPath = findSuitableTempDirectory(conf)
  var downloadedFile = path.join(tmpPath, fileName)
  var promise = kew.resolve(true)

  // Start the install.
  promise = promise.then(function () {
    console.log('Downloading', downloadUrl)
    console.log('Saving to', downloadedFile)
    return requestBinary(getRequestOptions(conf.get('proxy')), downloadedFile)
  })
  promise.then(function () {
    console.log('expect file md5: ', md5file(downloadedFile), 'to equal ', helper.md5)
    return validateMd5(downloadedFile, helper.md5)
  })
  .then(function () {
    return extractDownload(downloadedFile, tmpPath)
  })
  .then(function () {
    return copyIntoPlace(tmpPath, libPath)
  })
  .then(function () {
    console.log('Done. iedriver binary available at', helper.path)
  })
  .fail(function (err) {
    console.error('iedriver installation failed', err, err.stack)
    process.exit(1)
  })
})


function findSuitableTempDirectory(npmConf) {
  var now = Date.now()
  var candidateTmpDirs = [
    process.env.TMPDIR || '/tmp',
    npmConf.get('tmp'),
    path.join(process.cwd(), 'tmp')
  ]

  for (var i = 0; i < candidateTmpDirs.length; i++) {
    var candidatePath = path.join(candidateTmpDirs[i], 'iedriver')

    try {
      mkdirp.sync(candidatePath, '0777')
      var testFile = path.join(candidatePath, now + '.tmp')
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      return candidatePath
    } catch (e) {
      console.log(candidatePath, 'is not writable:', e.message)
    }
  }

  console.error('Can not find a writable tmp directory, please report issue on https://github.com/barretts/iedriver/issues/ with as much information as possible.');
  process.exit(1);
}


function getRequestOptions(proxyUrl) {
  if (proxyUrl) {
    var options = url.parse(proxyUrl)
    options.path = downloadUrl
    options.headers = { Host: url.parse(downloadUrl).host }
    // Turn basic authorization into proxy-authorization.
    if (options.auth) {
      options.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(options.auth).toString('base64')
      delete options.auth
    }

    return options
  } else {
    return url.parse(downloadUrl)
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

  console.log('Validating MD5 checksum')

  try {
    if (md5file(filePath).toLowerCase() == md5value.toLowerCase()) {
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

  console.log('Extracting zip contents')
  try {
    var zip = new AdmZip(filePath)
    zip.extractAllTo(tmpPath, true)
    deferred.resolve(true)
  } catch (err) {
    deferred.reject('Error extracting archive ' + err.stack)
  }
  return deferred.promise
}


function copyIntoPlace(tmpPath, targetPath) {
  rimraf(targetPath);
  console.log("Copying to target path", targetPath);
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
      deferred.resolve(true);
    });

    reader.pipe(writer);
    return deferred.promise;
  });

  return kew.all(promises);
}
