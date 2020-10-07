const path = require('path');
const fs = require('fs');

const APP_DIR = process.cwd();
const BUILD_DIR = path.resolve(APP_DIR, 'build');
const PUBLIC_DIR = path.resolve(APP_DIR, 'public');

function getBuildPath(name) {
  return path.resolve(BUILD_DIR, name);
}

function getPublicPath(name) {
  return path.resolve(PUBLIC_DIR, name);
}

function emptyDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdir(dir, (_, files) => {
      files.forEach((item) => {
        if (/_|\.[\w]+/.test(item)) {
          fs.unlinkSync(getBuildPath(item));
        } else {
          fs.rmdirSync(getBuildPath(item), { recursive: true });;
        }
      })
    })
  } else {
    fs.mkdirSync(dir);
  }
}

function copyPublic(passList) {
  fs.readdir(PUBLIC_DIR, (_, files) => {
    files.forEach((item) => {
      if (!passList.includes(item)) {
        fs.copyFileSync(getPublicPath(item), getBuildPath(item));
      }
    })
  })
}

emptyDir(BUILD_DIR);
copyPublic(["index.html"]);
