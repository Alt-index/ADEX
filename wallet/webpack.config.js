// webpack.config.js
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const helpers = require('./config/helpers');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path')

module.exports = {
  entry: {
    app: './src/app.ts',
    vendor: './src/vendor.ts',
    polyfills: './src/polyfills.ts'
  },
  target: 'electron-renderer',
  output: {
    path: __dirname + '/build/',
    publicPath: __dirname + '/build',
    filename: '[name].js',
    sourceMapFilename: '[name].js.map',
    chunkFilename: '[id].chunk.js',
    // libraryTarget: "commonjs2"
  },
  // externals: [nodeExternals()],


  resolve: {
    extensions: ['.ts', '.js', '.node'],
    modules: [helpers.root('src'), 'node_modules'],
    alias: {
      // Allow friendly reference to core modules
      images: helpers.root('src/assets/images'),
      icons: helpers.root('src/assets/icons'),
      fonts: helpers.root('src/assets/Lato')
    }
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: [
          {
            loader: 'awesome-typescript-loader',
            options: { configFileName: helpers.root('src', 'tsconfig.json') }
          }, 'angular2-template-loader'
        ]
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'file-loader?name=/assets/[name].[hash].[ext]'
      },
      {
        test: /\.css$/,
        exclude: helpers.root('src', 'app'),
        loader: ExtractTextPlugin.extract({ fallbackLoader: 'style-loader', loader: 'css-loader?sourceMap' })
      },
      {
        test: /\.css$/,
        include: helpers.root('src', 'app'),
        loader: 'raw-loader'
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  plugins: [
    // Workaround for angular/angular#11580
    new webpack.ContextReplacementPlugin(
      // The (\\|\/) piece accounts for path separators in *nix and Windows
      /angular(\\|\/)core(\\|\/)@angular/,
      helpers.root('./src'), // location of your src
      {} // a map of your routes
    ),

    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'vendor', 'polyfills']
    }),

    new HtmlWebpackPlugin({
      template: 'index.ejs',
      themeURL: __dirname + "/assets/css/theme.css",
      link : __dirname + "/assets/css/main.css"
    }),
    new CopyWebpackPlugin([
      {
        from: helpers.root('src/assets'),
        to: 'assets'
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: helpers.root('src/assets/images'),
        to: 'icons'
      }
    ])
  ],
  node: {
    global: true,
    progress: false,
    crypto: 'empty',
    module: false,
    clearImmediate: false,
    setImmediate: false
  }
};
