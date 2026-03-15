/**
 * React 19 JSX compatibility shim for third-party libraries
 *
 * React 19 changed the JSX namespace structure. Libraries that haven't updated
 * their types will show TS2786 ("cannot be used as a JSX component") errors.
 * This augmentation bridges the gap until upstream packages are updated.
 *
 * @see https://react.dev/blog/2024/04/25/react-19-upgrade-guide#the-jsx-namespace-in-typescript
 */
import type { JSX as ReactJSX } from 'react';

declare module 'react' {
  // biome-ignore lint/style/noNamespace: TypeScript declaration file for React 19 JSX compat
  namespace JSX {
    interface Element extends ReactJSX.Element {}
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}
