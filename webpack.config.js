var path = require('path');

module.exports = {
  entry: {
    'main': ['@babel/polyfill', './src/main'],
    'worker': ['@babel/polyfill', './src/simWorker'],
  },
  output: {
    path: path.resolve(__dirname, 'assets'),
    filename: '[name].js'
  },
  devServer: {
    publicPath: '/assets/'
  },
  devtool: 'source-map',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-proposal-class-properties']
        }
      }
    }]
  },
  resolve: {
    extensions: ['.js'],
    alias: {
    }
  }
};
