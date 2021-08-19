module.exports.get = (req, res) => {
  console.log(
`/pets/:id/photos/:photo_id.js:get(id=${req.params.id}, photo_id=${req.params.photo_id})
req: ${JSON.stringify(req,null,2)}
res: ${JSON.stringify(res,null,2)}
`)
  res.body = {id:req.params.id, photo_id: req.params.photo_id}
  return res
}
