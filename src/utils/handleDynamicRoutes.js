// Generalized function to handle dynamic routes
function handleDynamicRoutes(req, res, routes) {
  const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;

  for (const route in routes) {
    const routePattern = new RegExp(
      "^" + route.replace(/:\w+/g, "(\\w+)") + "$"
    );
    const match = urlPath.match(routePattern);

    if (match) {
      req.params = match.slice(1).reduce((params, value, index) => {
        const paramName = route.match(/:(\w+)/g)[index].slice(1);
        params[paramName] = value;
        return params;
      }, {});

      routes[route](req, res);
      return true;
    }
  }

  return false; // No matching route found
}

module.exports = handleDynamicRoutes;
