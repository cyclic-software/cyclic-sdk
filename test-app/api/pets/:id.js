module.exports.get = (req, res) => {
  console.log('/pets/:id.js:get(id=',req.params.id,')\nreq: ',req,'\nres: ',res)
  res.body = {id:req.params.id}
  return res
}
