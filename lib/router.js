const path = require('path');
const fs = require('fs');

// import path from 'path';
// import fs from 'fs';


let absDir;

function defaultHandler(req, res) {
  res.status = 200;
  if (req.headers.accept.includes('text/html')) {
    res.set('Content-Type', 'text/html');
    let markdown = '# **This** is my default [markdown](https://example.com)';
    const readmeFilename = path.resolve(absDir, 'README.md');
    try {
      markdown = fs.readFileSync(readmeFilename, 'utf-8');
    } catch (error) {
      console.log(error);
    }
    res.body = `<html>
    <head>
    <script type="module" src="https://cdn.jsdelivr.net/gh/zerodevx/zero-md@2/dist/zero-md.min.js"></script>
    </head>
    <body>
        <zero-md>
        <script type="text/markdown">
${markdown}
        </script>
        </zero-md>
    </body>
</html>`;
  } else {
    res.set('Content-Type', 'application/json');
    res.body = { req: { url: req.url, headers: req.headers, body: req.body } };
  }
  return res;
}

function errorHandler(req, res, error = new Error()) {
  res.status = 500;
  res.headers = { 'Content-Type': 'application/json' };
  res.body = { msg: error.message, error: error.stack, req: { url: req.url, headers: req.headers, body: req.body } };
  return res;
}

function handlerStatic(filename) {
  return function (req, res) {
    console.log('static file');
    defaultHandler(req, res);
  };
}

// Return example: [
//  {regex: /\//, handlerPath: '/Users/ckl/git/cyclic/demo-api/src/index.js'},
//  {regex: /\/pets\/(?<id>[a-z0-9_-]+)/, handlerPath: '/Users/ckl/git/cyclic/demo-api/src/pets/:id.js'},
// ]
// Return all array of routes. Routes contain regex and handlerPath
function generateRoutes(rootDir) {
  return findAllFiles(rootDir).map((e) => ({
    handlerPath: e,
    handler: (e.endsWith('.js')) ? require(e) : handlerStatic(e),
    regex: nameToRegex(e.replace(rootDir, '')),
  }));
}

function findAllFiles(name) {
  let files = [];
  if (fs.statSync(name).isDirectory()) {
    fs.readdirSync(name).forEach((child) => {
      files = files.concat(findAllFiles(path.join(name, child)));
    });
  } else {
    files.push(name);
  }
  return files;
}

function nameToRegex(fileName) {
  // Handle special case of / => /index.js and /xyz => /xyz.js
  let pattern = fileName.replace(/\/index.js$/, '/').replace(/\.js$/, '');

  // only process dynamic logic if there is a variable in the filename
  if (pattern.indexOf(':') != -1) {
    pattern = pattern.split('/').map((e) => {
      // skip static strings parts
      if (e.indexOf(':') === -1) {
        return e;
      }

      const varGrabber = /:(?<varName>[A-Za-z0-9_-]+)/mg;
      const match = varGrabber.exec(e);
      const { varName } = match.groups;
      return `(?<${varName}>[A-Za-z0-9_-]+)`;
    }).join('\\/');
  }
  console.log(`${fileName}: ${pattern}`)
  var rEx = new RegExp(`^${pattern}$`);
  return rEx;
}

/*
Set params on the req and return the handler
*/
let routes;

function resolveHandler(req, srcRoot = '../test-app') {
  try {
    absDir = path.resolve(srcRoot);
    routes = routes || generateRoutes(absDir);
  } catch (error) {
    console.log(__dirname);
    console.log(srcRoot);
    console.log(routes);
    console.log(error);
  }

  req.params = req.params || {};

  let handler = { all: defaultHandler };
  routes.some((r) => {
    const match = r.regex.exec(req.path);
    if (match) {
      // console.log('matched=',r.regex,'from file=',r.handlerPath)
      // try to load the handler. If failure kick a 500 w/ trace
      try {
        // handler = require(r.handlerPath)
        handler = r.handler;
      } catch (error) {
        console.log(error);
        handler = { all: errorHandler };
      }
      req.params = { ...req.params, ...match.groups };
      // console.log('-=> params yo:', req.params)
      return true;
    }
    return false;
  });
  return handler;
}

// Call the appropriate handler function with the req/res
function handle(handler, req, res) {
  const method = req.method.toLowerCase();
  let func = handler[method];
  if (!func) {
    if (handler.all) {
      func = handler.all;
    } else {
      throw new Error(`Found handler but it is missing the requested method [${method}] or 'all'`);
    }
  }
  return func(req, res);
}

module.exports.resolveHandler = resolveHandler;
module.exports.findAllFiles = findAllFiles;
module.exports.nameToRegex = nameToRegex;

module.exports.generateRoutes = generateRoutes;
module.exports.handle = handle;
