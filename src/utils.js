const fs = require('fs');
const path = require('path');

function resolveDefaultKnexfilePath() {
  return path.join(process.cwd(), 'knexfile.js');
}

function tryLoadingDefaultConfiguration() {
  const knexfilePath = resolveDefaultKnexfilePath();
  if (fs.existsSync(knexfilePath)) {
    return require(knexfilePath); // eslint-disable-line import/no-dynamic-require
  }
}

module.exports = {
  resolveDefaultKnexfilePath,
  tryLoadingDefaultConfiguration,
};
