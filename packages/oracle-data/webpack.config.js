const { resolve } = require('path');

module.exports = {
    mode: 'development',
    entry: './dist/index.js',
    optimization: {
        minimize: true
    },
    devtool: 'false',
    output: {
        library: 'OracleDataProvider',
        libraryTarget: 'umd',
        path: resolve(__dirname, 'dist'),
        filename: 'oracle-data.min.js'
    }
};
