const { src, dest } = require('gulp');

// Copy node/credential icons into dist so n8n can render them.
function buildIcons() {
  return src(['nodes/**/*.{png,svg}', 'credentials/**/*.{png,svg}'], {
    base: '.',
    encoding: false,
  }).pipe(dest('dist'));
}

exports['build:icons'] = buildIcons;
