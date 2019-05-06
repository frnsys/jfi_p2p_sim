var path = require('path');

module.exports = {
  entry: {
    'main': ['@babel/polyfill', './src/main'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
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
