var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/index',
  output: {
    filename: 'jikko.js',
    path: path.resolve(__dirname, 'bin')
  },
  target: 'node',
  plugins: [
    new webpack.BannerPlugin({
      banner: "#!/usr/bin/env node",
      raw: true
    })
  ]
};
