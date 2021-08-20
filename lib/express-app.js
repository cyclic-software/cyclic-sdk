// import express, {Express, Request, Response} from 'express'
const express = require('express')
const app = express()

const router = require('./router')

const CLIENT_API_ROOT = process.env.PWD

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

async function handler(req, res) {
  try {
    console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env,null,2))
    // console.log('## CONTEXT: ' + JSON.stringify(context,null,2))
    // console.log('## EVENT: ' + JSON.stringify(event,null,2))

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
      console.log(`handler func returned: ${result}`)
    }

    // publish req/res to sns
    // sns.publish({req,res})

    // let lambdaRes = formatResponse(res)

    console.log('## RESPONSE: ' + JSON.stringify(res.body,null,2))
    return res
  } catch(error) {
    return formatError(error)
  }
}

function formatResponse(res) {
  return res
}
function formatError(error) {
  throw error
}


app.use('*', async (req,res) => {
  // console.log(`[cyclic] ${req.method} ${req.path}`)

  console.log(req.headers)
  console.log(req.protocol,req.hostname,req.path,req.params)

  res.set('x-powered-by', 'cyclic.sh')
  await handler(req,res)

  res.end()
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

})


module.exports.app = app
