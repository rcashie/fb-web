import copy from 'rollup-plugin-copy';
import { nodeResolve } from '@rollup/plugin-node-resolve';

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
        })
    ],
    output: {
        entryFileNames: '[name].js',
        format: 'esm',
        dir: './build/static',
        preserveModules: true,
    }
};
