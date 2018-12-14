const { resolve } = require('path');

module.exports = {
    mode: 'development',
    entry: './dist/index.js',
    output: {
        library: 'OracleDataProvider',
        path: resolve(__dirname, 'dist'),
        filename: 'oracle-data.min.js'
    }
};
