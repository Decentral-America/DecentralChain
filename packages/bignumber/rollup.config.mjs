import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));


export default [
    {
        input: 'src/index.ts',
        output: {
            name: 'BigNumber',
            file: pkg.browser.replace('umd.min', 'umd'),
            format: 'umd',
            exports: 'named'
        },
        plugins: [
            resolve(),
            typescript({ tsconfig: './tsconfig.rollup.json' }),
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            name: 'BigNumber',
            file: pkg.browser,
            format: 'umd',
            exports: 'named'
        },
        plugins: [
            resolve(),
            typescript({ tsconfig: './tsconfig.rollup.json' }),
            terser(),
        ]
    }
];