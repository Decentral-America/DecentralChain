const { resolve } = require('path');

module.exports = [
  {
    entry: './src/index.ts',
    mode: 'production',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: ['ts-loader'],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      libraryTarget: 'umd',
      globalObject: 'this',
      library: 'providerCubensis',
      filename: 'provider-cubensis.js',
      path: resolve(__dirname, 'dist'),
    },
  },
];
