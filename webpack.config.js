const path = require("path");
const appBuild = path.resolve(__dirname, "build");
const appIndex = path.resolve(__dirname, "src", "index.tsx");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const appHtml = path.resolve(__dirname, "public", "index.html");
require("dotenv").config();
const webpack = require("webpack");
const ManifestPlugin = require("webpack-manifest-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const appPublic = path.resolve(__dirname, "public");
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";
const TerserPlugin = require("terser-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

function getClientEnv(nodeEnv) {
  return {
    "process.env": JSON.stringify(
      Object.keys(process.env)
        .filter((key) => /^REACT_APP/i.test(key))
        .reduce((env, key) => {
          env[key] = process.env[key];
          return env;
        }, { NODE_ENV: nodeEnv })
    )
  }
}

module.exports = (webpackEnv) => {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";
  const clientEnv = getClientEnv(webpackEnv);
  return {
    mode: webpackEnv,
    entry: appIndex,
    output: {
      path: appBuild,
      chunkFilename: isEnvProduction ? "static/js/[name].[contenthash:8].chunk.js" : isEnvDevelopment && "static/js/[name].chunk.js",
    },
    optimization: {
      splitChunks: {
        chunks: "all"
      },
      runtimeChunk: {
        name: (entrypoint) => `runtime-${entrypoint.name}`
      },
      minimize: isEnvProduction,
      minimizer: [new TerserPlugin()]
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            "cache-loader",
            {
              loader: "ts-loader",
              options: {
                transpileOnly: isEnvDevelopment
              }
            }
          ]
        },
        {
          loader: "file-loader",
          exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
          options: {
            outputPath: "static/media",
            name: "[name].[hash:8].[ext]",
            esModule: false,
          }
        },
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          loader: "url-loader",
          options: {
            limit: 10000,
            outputPath: "static/media",
            name: "[name].[hash:8].[ext]",
          }
        },
      ]
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"]
    },
    plugins: [
      new HtmlWebpackPlugin({template: appHtml}),
      new webpack.DefinePlugin(clientEnv),
      new ManifestPlugin({
        generate: (seed, files, entryPoints) => {
          const manifestFiles = files.reduce((manifest, {name, path}) => ({ ...manifest, [name]: path}), seed);
          const entryFiles = entryPoints.main.filter((filename) => !/\.map/.test(filename));
          return { files: manifestFiles, entryPoints: entryFiles }
        }
      }),
      new ForkTsCheckerWebpackPlugin({
        eslint: {
          files: "./src/**/*.{ts,tsx,js,jsx}"
        }
      }),
      isEnvProduction && new BundleAnalyzerPlugin(),
    ].filter(Boolean),
    cache: {
      type: isEnvDevelopment ? "memory" : isEnvProduction && "filesystem"
    },
    devServer: {
      port: 3000,
      contentBase: appPublic,
      open: true,
      historyApiFallback: true,
      overlay: true,
      stats: "errors-warnings"
    },
    devtool: isEnvProduction 
      ? shouldUseSourceMap 
        ? "source-map" 
        : false 
      : isEnvDevelopment && "cheap-module-source-map",
    stats: {
      builtAt: false,
      children: false,
      entrypoints: false,
      hash: false,
      modules: false,
      version: false,
      publicPath: true,
      excludeAssets: [/\.(map|txt|html|jpg|png)$/, /\.json$/],
      warningsFilter: [/exceed/, /performance/],
    },
  }
}
