module.exports.get = (req, res) => {
  // console.log('called /index.js:get()\nreq: ',req,'\nres: ',res)
  res.status = 200
  res.header('Content-Type','text/html')
  res.body = '<meta charset="UTF-8"><h1>Hello world!</h1>'
  return res
}

module.exports.all = (req, res) => {
  // console.log('called /index.js:all()\nreq: ',req,'\nres: ',res)
  return res
}
