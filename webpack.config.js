/* eslint-disable no-undef */

const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const urlDev = "https://localhost:3000/";
// const urlProd = "https://www.contoso.com/"; // CHANGE THIS TO YOUR PRODUCTION DEPLOYMENT LOCATION
const urlProd = "https://msmsrep.github.io/LocalTranslatorForExcel/dist/";

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      react: ["react", "react-dom"],
      // 変更
      // taskpane: {
      index: {
        // import: ["./src/taskpane/index.jsx", "./src/taskpane/taskpane.html"],
        import: ["./src/main.jsx", "./src/index.html"],
        dependOn: "react",
      },
      // 不要
      // commands: "./src/commands/commands.js",
    },
    output: {
      clean: true,
    },
    // cssを追加
    resolve: {
      extensions: [".js", ".jsx", ".html", ".css"],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          use: {
            loader: "babel-loader",
          },
          exclude: /node_modules/,
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|ttf|woff|woff2|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
        // cssについて追加
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      // 変更
      // new HtmlWebpackPlugin({
      //   filename: "taskpane.html",
      //   template: "./src/taskpane/taskpane.html",
      //   chunks: ["polyfill", "taskpane", "react"],
      // }),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: "./src/index.html",
        chunks: ["polyfill", "index", "react"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "manifest*.xml",
            to: "[name]" + "[ext]",
            transform(content) {
              if (dev) {
                return content;
              } else {
                return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
              }
            },
          },
        ],
      }),
      // 不要
      // new HtmlWebpackPlugin({
      //   filename: "commands.html",
      //   template: "./src/commands/commands.html",
      //   chunks: ["polyfill", "commands"],
      // }),
      new webpack.ProvidePlugin({
        Promise: ["es6-promise", "Promise"],
      }),
    ],
    devServer: {
      hot: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
      // websocketの追加
      client: {
        webSocketURL: {
          hostname: "localhost",
          port: 3000,
          pathname: "/ws",
          protocol: "wss",
        },
      },
    },
    // エラーについて追加
    stats: {
      // 詳細なエラー出力
      errorDetails: true,
    },
    // transformers.jsライブラリでの警告がでるのでチェックをムシ
    ignoreWarnings: [
      /Critical dependency: the request of a dependency is an expression/,
      /Critical dependency: 'import\.meta'/
    ]
  };
  return config;
};
