IEDriver
=======

An NPM wrapper for Selenium [IEDriver](http://selenium-release.storage.googleapis.com).

[IEDriver changelog](https://raw.githubusercontent.com/SeleniumHQ/selenium/master/cpp/iedriverserver/CHANGELOG)

Testing notes
-----------------------
If you're testing on Windows 8 KB3025390 from Janurary 5th 2015 breaks IEDriver, just uninstall that update.

More tips on getting setup right: http://heliumhq.com/docs/internet_explorer


Building and Installing
-----------------------

```shell
npm install iedriver
```

Or grab the source and

```shell
node ./install.js
```

What this is really doing is just grabbing a particular "blessed" (by
this module) version of IEDriver. As new versions are released
and vetted, this module will be updated accordingly.

The package has been set up to fetch and run IEDriver for Windows.

Versioning
----------

The NPM package version tracks the version of iedriver that will be installed,
with an additional build number that is used for revisions to the installer.

A Note on iedriver
-------------------

IEDriver is not a library for NodeJS.

This is an _NPM wrapper_ and can be used to conveniently make IEDriver available
It is not a Node JS wrapper.

Contributing
------------

Questions, comments, bug reports, and pull requests are all welcome.  Submit them at
[the project on GitHub](https://github.com/barretts/node-iedriver/).

Bug reports that include steps-to-reproduce (including code) are the
best. Even better, make them in the form of pull requests.

Author
------
[Barrett Sonntag](https://github.com/barretts)


Thanks to [Giovanni Bassi](https://github.com/giggio) for making the [ChromeDriver](https://github.com/giggio/node-chromedriver/) module this was based on.

License
-------

Licensed under the Apache License, Version 2.0.
