module.exports.all = (req,res) => {
  console.log('in all handler')
  res.json({req,res})
}
