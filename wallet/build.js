'use strict';
const packager = require('electron-packager');
const packageJ = require('./package.json');
const appVersion = packageJ.version || '1.0.0';
const args = process.argv.slice(2);
const name = 'Xplodde';
const ignoreFolders = ['.idea', 'index.db', 'index.db-journal', 'crea-test-db-sql', 'app.conf', 'bin'];

function buildOptions(platform) {
  return {
    'arch': 'x64',
    'platform': platform,
    'dir': './',
    'ignore': ignoreFolders,
    'appCopyright': 'Xplodde 2017',
    'appVersion': appVersion,
    'asar': true,
    'icon': 'xplodde.ico',
    'name': name,
    'out': './releases',
    'overwrite': true,
    'prune': true,
    'electronVersion': '1.8.4',
    'version-string': {
      'CompanyName': 'Xplodde',
      'FileDescription': 'Xplodde media explorer and wallet', /*This is what display windows on task manager, shortcut and process*/
      'OriginalFilename': name + '-' + platform + '-' + appVersion,
      'ProductName': name,
      'InternalName': name
    }
  };
}
let optionsWindows = buildOptions('win32');
let optionsLinux = buildOptions('linux');
let optionsMac = buildOptions('darwin');

let options = {
  windows: optionsWindows,
  linux: optionsLinux,
  mac: optionsMac
};
let sArgs = args.join('--');

let platform = sArgs.match('-p=([^-.]*)');
platform = platform ? platform[1] : null;

let arch = sArgs.match('-a=([^-.]*)');
arch = arch ? arch[1] : null;

let outPath = sArgs.match('-o=([^-.]*)');
outPath = outPath ? outPath[1] : null;


if (platform && !options[platform]) {
  console.log("ErrorCodes: platform [" + platform + "] is not valid.\n", "Please use one of the following: \n")
  console.log("Available Platforms: [windows, linux, mac]");
  return console.log("Available Architectures: [windows: x64 ia32, linux: x86 x86_x64, mac: x64]");
}
else if (!platform) {
  let platforms = Object.keys(options);
  for (let i = 0; i < platforms.length; i++) {
    let opts = options[platforms[i]];
    if (arch) {
      opts.arch = arch;
    }
    if (outPath) {
      opts.out = outPath;
    }

    console.log("Building - " + opts.name + "(" + opts.appVersion + ")" + "...");
    console.log("   - ElectronVersion - " + opts.electronVersion);
    console.log("   - Platform        - " + (platform || opts.platform));
    console.log("   - Architecture    - " + (arch || opts.arch));
    console.log("\n");
    packager(opts, function done_callback(err, appPaths) {
      if (err) {
        console.log("\nThere has been an error Building[" + opts.platform + "](" + (opts.arch) + "): ", err);
      } else {
        console.log("\nBuild for " + opts.platform + "(" + (opts.arch) + ") completed. Status [OK]");
        console.log("You can find builds at '" + appPaths + "'");
      }

    });
  }
}
else {
  let opts = options[platform];
  if (arch) {
    opts.arch = arch;
  }
  if (outPath) {
    opts.out = outPath;
  }
  console.log("Building - " + opts.name + "(" + opts.appVersion + ")" + "...");
  console.log("   - ElectronVersion - " + opts.electronVersion);
  console.log("   - Platform        - " + platform);
  console.log("   - Architecture    - " + (arch || opts.arch));
  console.log("\n");

  packager(opts, function done_callback(err, appPaths) {
    if (err) {
      console.log("\nThere has been an error Building[" + platform + "](" + (arch || opts.arch) + "): ", err);
    }
    else {
      console.log("\nBuild for " + platform + "(" + (arch || opts.arch) + ") completed. Status [" + ((appPaths != '') ? 'OK' : 'FAIL') + "]");
      if ((appPaths != '')) console.log("You can find builds at '" + appPaths + "'");
      else console.log("There has been an error with build. ErrorCodes should be shown above");
    }
  });

}