import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
    entry: './src/main.js',
    output: {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(process.cwd(), 'dist'),
        publicPath: 'auto',
        clean: true
    },
    devtool: 'source-map',
    devServer: {
        port: 5173,
        static: './dist',
        client: { overlay: true }
    },
    module: {
        rules: [
            { test: /\.css$/i, use: ['style-loader', 'css-loader'] }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            minify: false
        })
    ]
};
