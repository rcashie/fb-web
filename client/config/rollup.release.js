import copy from 'rollup-plugin-copy';
import gzipPlugin from 'rollup-plugin-gzip';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import * as path from 'path';

const currentDir = path.resolve('./');

export default {
    input: [
        './cmps/fb-app.js',
        './node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js'
    ],
    plugins: [
        nodeResolve(),
        copy({
            targets: [
                { src: './images/**', dest: './build/static/images' },
            ]
        }),
        minifyHTML(),
        gzipPlugin(),
    ],
    output: {
        entryFileNames: info => {
            return info.facadeModuleId.substr(currentDir.length + 1);
        },
        dir: './build/static',
        format: 'esm',
        plugins: [ terser() ],
    }
};
