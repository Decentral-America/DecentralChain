/**
 * Module augmentation for 'ramda'.
 *
 * @types/ramda@0.31.x (via types-ramda@0.31.0) types the curried form of
 * `renameKeys` with `T extends Record<keyof U, unknown>` on the input object,
 * which is overly restrictive for our DB-to-domain mapping pattern where
 * pg-promise returns plain objects typed as `unknown`.
 *
 * This adds permissive overloads with explicit TOut / TIn type parameters so
 * call-sites can express intent (input type -> output type) without casting.
 * The augmented overloads are tried after the built-in ones, so all
 * correctly-typed call-sites continue to use the more precise inference.
 *
 * IMPORTANT: The top-level `export {}` is required — without it, TypeScript
 * treats this as an ambient module declaration and REPLACES all of ramda's
 * exports. The export makes this a "module" file, enabling augmentation.
 */
export {};

declare module 'ramda' {
  // Curried form: renameKeys<OutputType>(mapping)(obj)
  // Curried form with explicit input: renameKeys<OutputType, InputType>(mapping)(obj)
  export function renameKeys<TOut, TIn = unknown>(
    mapping: Record<string, string>,
  ): (obj: TIn) => TOut;

  // 2-arg form: renameKeys<OutputType>(mapping, obj)
  export function renameKeys<TOut, TIn = unknown>(
    mapping: Record<string, string>,
    obj: TIn,
  ): TOut;
}
