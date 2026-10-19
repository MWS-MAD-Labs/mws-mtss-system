const router = require('../../src/routes/users');

// People are managed in Central, so MTSS only reads them.
describe('users routes', () => {
    const routes = router.stack
        .filter((layer) => layer.route)
        .flatMap((layer) => Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route.path}`));

    test('only expose reads', () => {
        expect(routes.every((route) => route.startsWith('GET '))).toBe(true);
        expect(routes.length).toBeGreaterThan(0);
    });
});
