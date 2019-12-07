const path = require('path');
const config = require('config');
const webpack = require('webpack');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = (env = {}) => {
  const isDevelopment = (env.mode || 'development') === 'development';

  return {
    target: 'web',
    mode: env.mode || 'development',
    entry: {
      web: path.join(__dirname, 'src', 'frontend', 'web', 'index.js')
    },
    devServer: {
      host: config.webpackDevServer.host,
      port: config.webpackDevServer.port,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Max-Age': '3000',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET'
      }
    },
    node: {
      fs: 'empty'
    },
    resolve: {
      extensions: ['.js'],
      alias: {
        config: 'noop'
      }
    },
    output: {
      path: path.join(__dirname, 'dist', 'frontend'),
      publicPath: isDevelopment ?
        `//${config.webpackDevServer.host}:${config.webpackDevServer.port}/` :
        `${config.s3.urlPrefix}/assets/`,
      filename: isDevelopment ? '[name].js' : '[name].[hash:8].js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  '@babel/preset-env',
                  '@babel/react'
                ],
                plugins: [
                  '@babel/plugin-syntax-dynamic-import',
                  '@babel/plugin-proposal-class-properties'
                ]
              }
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            {loader: MiniCssExtractPlugin.loader},
            {loader: 'css-loader'}
          ]
        },
        {
          test: /\.scss$/,
          use: [
            {loader: MiniCssExtractPlugin.loader},
            {loader: 'css-loader'},
            {loader: 'sass-loader'}
          ]
        },
        {
          test: /\.(jpg|png|gif|eot|svg|woff|woff2|ttf)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'resources/[name].[hash:8].[ext]',
                publicPath: isDevelopment ?
                  `//${config.webpackDevServer.host}:${config.webpackDevServer.port}/` :
                  `${config.s3.urlPrefix}/assets/`
              }
            }
          ]
        }
      ]
    },
    optimization: {
      splitChunks: {
        chunks: 'initial',
        minSize: 16000,
        maxSize: 0,
        minChunks: 1,
        maxAsyncRequests: 1,
        maxInitialRequests: 1,
        automaticNameDelimiter: '-',
        name: true
      }
    },
    plugins: (() => {
      const result = [
        new MiniCssExtractPlugin({
          filename: isDevelopment ? '[name].css' : '[name].[hash:8].css',
          chunkFilename: isDevelopment ? '[name]-[id].css' : '[name]-[id].[hash:8].css'
        }),
        new HtmlWebpackPlugin({
          chunks: ['web'],
          filename: path.join('express', 'web.html'),
          template: path.join('src', 'frontend', 'express', 'web.html'),
          inject: false
        }),
        new webpack.ProvidePlugin({$: 'jquery'})
      ];
      if (!isDevelopment) {
        result.push(
          new OptimizeCSSAssetsPlugin({
            cssProcessorOptions: {
              discardComments: {removeAll: true}
            }
          })
        );
        result.push(
          new ImageminPlugin({
            test: /\.(?:png|jpg)$/i,
            pngquant: {quality: 100},
            jpegtran: {progressive: true}
          })
        );
      }

      return result;
    })()
  };
};
