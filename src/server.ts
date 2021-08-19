const {app} = require('./express-app')

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`[cyclic] server on http://localhost:${port}`)
})
