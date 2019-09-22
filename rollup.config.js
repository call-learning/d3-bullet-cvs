import noderesolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-porter';
import * as meta from './package.json';

const config = {
  input: 'src/index.js',
  external: Object.keys(meta.dependencies || {}).filter(key => /^d3-/.test(key)),
  output: {
    file: `dist/${meta.name}.js`,
    name: 'd3',
    format: 'umd',
    indent: false,
    extend: true,
    sourcemap: true,
    banner: `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}
    //  https://github.com/call-learning/d3-bullet-cvs v${meta.version}. Copyright 2019 SAS CALL Learning`,
    globals: Object.assign({}, ...Object.keys(meta.dependencies || {}).filter(key => /^d3-/.test(key)).map(key => ({ [key]: 'd3' })))
  },
  plugins: [
    noderesolve(),
    css({minified:`dist/${meta.name}.css`}),
  ]
};

export default [
  config,
  {
    ...config,
    output: {
      ...config.output,
      file: `dist/${meta.name}.min.js`
    },
    plugins: [
      ...config.plugins,
      terser({
        output: {
          preamble: config.output.banner
        }
      })
    ]
  }
];
