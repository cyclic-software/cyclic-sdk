const app = require('./hello-world-app')

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`test/app/server.js listening at http://localhost:${port}`)
})
