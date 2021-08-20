import babel from "rollup-plugin-babel";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import filesize from "rollup-plugin-filesize";
import { uglify } from "rollup-plugin-uglify";

const isProd = process.env.NODE_ENV === "production";

export default {
  input: "src/MyPromise.js",
  output: {
    file: isProd ? "dist/MyPromise.min.js" : "dist/MyPromise.js",
    format: "umd",
    name: "MyPromise",
  },
  plugins: [
    commonjs(),
    nodeResolve(),
    babel({
      exclude: "node_modules/**",
      presets: [
        [
          "@babel/preset-env",
          {
            useBuiltIns: "usage",
            corejs: "3.16.2",
          },
        ],
      ],
    }),
    filesize(),
    isProd && uglify(),
  ],
};
