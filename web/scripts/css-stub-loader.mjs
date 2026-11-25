/**
 * Node loader that resolves CSS module imports to an identity stub, so the
 * React tree can be rendered in plain Node for the structural check.
 */
const stubUrl = new URL('./css-module-stub.mjs', import.meta.url).href;

export function resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('.css')) {
        return { url: stubUrl, shortCircuit: true };
    }
    return nextResolve(specifier, context);
}
