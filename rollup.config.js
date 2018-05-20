import resolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

const globals = {
  '@angular/core': 'ng.core',
  '@angular/common': 'ng.common',
  'rxjs': 'Rx'
};

export default {
  external: Object.keys(globals),
  plugins: [resolve(), sourcemaps()],
  onwarn: () => { return },
  output: {
    format: 'umd',
    name: 'ng.ngxUiScroll',
    globals: globals,
    sourcemap: true,
    exports: 'named'
  }
}
