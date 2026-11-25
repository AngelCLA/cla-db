/** Identity stub: class names map to themselves, as CSS modules would in a browser. */
const styles = new Proxy(
    {},
    {
        get: (_target, key) => (typeof key === 'string' ? key : undefined)
    }
);

export default styles;
