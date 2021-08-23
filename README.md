# @cyclic.sh/sdk

Cyclic api framework. Build vanilla javascript APIs without the headache.

## Quick Start

Run the following:

```sh
npm install @cyclic.sh/sdk

echo "const sdk = require('@cyclic.sh/sdk')" >> server.js

mkdir api
echo "module.exports.all = async (req,res) => {
  console.log(req.body)
  res.set('Content-Type','application/json')
  res.body = {headers: req.headers, params: req.params, env: process.env}
}" > api/index.js
npx cy
```
You now have a running API running on port 3000

`curl -i -XGET http://localhost:3000`

## API Routes

Cyclic uses path based routing to find the right handler. Then resolves the handler method based on HTTP method.

```text
.
├── api
│   ├── index.js     <- responds to: /
│   ├── pets.js      <- responds to: /pets
│   └── pets
│       ├── index.js <- responds to: /pets/
│       └── :id.js   <- responds to: /pets/${id}
├── package-lock.json
├── package.json
└── server.js
```

## Handler Methods

Here is the logic cyclic uses to find a handler method:

```javascript
  const method = req.method.toLowerCase();
  let func = handler[method];
  if (!func) {
    if (handler.all) {
      func = handler.all;
    } else {
      throw new Error(`Found handler but it is missing the requested method [${method}] or 'all'`);
    }
  }
```

## Installing

`npm install @cyclic.sh/sdk`


## For those developing this module

### Building

`npm install`

### Publishing

```
npm version [feature|minor|patch]
git push
git push --tags
npm publish --access=public
```
