require('dotenv').config()

const express = require('express')
const app = express()

const router = require('./router')

const CLIENT_API_ROOT = (process.env.CLIENT_API_ROOT)? (process.env.CLIENT_API_ROOT + '/api'): (process.env.PWD + '/api')

function buildReq(req){
  // let bodyAscii = (!event.isBase64Encoded)? event.body : Buffer.from(event.body, 'base64').toString('ascii')

  let r = {
    headers: req.headers,
    body: req.body,
    path: req.baseUrl + req.path,
    // params: event.queryStringParameters,
    params: req.params,
    method: req.method.toUpperCase()
  }
  return r
}

function buildRes(res){
  var r = {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: undefined,
    json: function(obj){
      // console.log(`setting body as: ${JSON.stringify(obj)}`)
      this.body = JSON.stringify(obj),
      this.set('Content-Type','application/json')
    },
    set: function(h,v) {
      // console.log(`setting header ${h}:${v}`)
      this.headers[h] = v
    },
    redirect: function(status, url){
      this.headers['Location'] = url
      this.status = status
    }
  }
  return r
}


function asyncify(fn) {
  let isAsync = false;
  return function () {
    const value = fn.apply(null, arguments);
    if (isAsync) {
      return value;
    }
    if (value && typeof value.then === "function") {
      isAsync = true;
      return value;
    }
    return Promise.resolve(value);
  };
}
module.exports.asyncify = asyncify

async function handler(exReq, exRes) {
    // console.log(`[cyclic] ${req.method} ${req.path}`)
    // res.json({
      // msg: "Huh?",
      // at: new Date().toISOString(),
      // method: req.method,
      // hostname: req.hostname,
      // ip: req.ip,
      // path: req.path,
      // query: req.query,
      // headers: req.headers,
      // cookies: req.cookies,
    // })
    // .end()

  try {
    // console.log('headers:', exReq.headers)
    // console.log(exReq.protocol, exReq.hostname, exReq.baseUrl, exReq.url, exReq.path, exReq.params)

    // console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env,null,2))
    // console.log('## CONTEXT: ' + JSON.stringify(context,null,2))
    // console.log('## EVENT: ' + JSON.stringify(event,null,2))

    let req = buildReq(exReq)
    let res = buildRes(exReq)

    let handler = router.resolveHandler(req, CLIENT_API_ROOT)

    if (!handler){
      throw new Error(`Unable to find handler for path: ${req.path} in root: ${CLIENT_API_ROOT}`)
      // handler = routes['*']
    }

    let HTTP_METHODS = ["POST","PUT","GET","OPTIONS","DELETE","HEAD","PATCH","TRACE","CONNECT"]

    if(!HTTP_METHODS.includes(req.method)){
      throw new Error(`Unknown request method [${req.method}]. Failing request.`)
    }

    let methodFuncName = req.method.toLowerCase()

    let func = ((req, res) => {throw new Error('Default function is being invoked, something went wrong.')})

    if (Object.keys(handler).includes(methodFuncName)){
      func = asyncify(handler[methodFuncName])
    } else if(handler.all) {
      func = asyncify(handler.all)
    } else {
      throw new Error(`Unknown request method [${req.method}]. Failing request.`)
    }

    let result = await func(req,res)
    if (result) {
      console.log(`handler func returned: ${JSON.stringify(result,null,2)}`)
      // console.log(JSON.stringify(result,null,2))
    }

    // console.log('## RESPONSE: ' + JSON.stringify(res.body,null,2))


    exRes.status(res.status)
    exRes.set(res.headers)
    exRes.set('x-powered-by', 'cyclic.sh')
    exRes.headers = res.headers
    exRes.send(res.body)
    exRes.end()
  } catch(error) {
    console.log(error)
    res.status(500).send('Yikes! Server sdk error.').end()
  }
}

var formatResponse = function(res){
  var encodedBody = res.body
  if (typeof(res.body) === 'object'){
    encodedBody = JSON.stringify(res.body)
  }
  var response = {
    "statusCode": res.status,
    "headers": res.headers,
    "isBase64Encoded": false,
    "body": encodedBody
  }
  return response
}

function formatError(error) {
  throw error
}

app.use('*', handler)


module.exports.app = app
