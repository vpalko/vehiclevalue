const express = require('express')
const bodyParser = require("body-parser")
const VehicleData = require('./services/vehiclevalue.js')
const app = express()
const port = process.env.PORT || 3004

app.disable('etag');
app.use(bodyParser.json())
app.listen(port, (err) => {
  if (err) {
    console.log({err: err})
  } else {
    console.log(`Listening on port: ${port}`)
  }
})

app.get('/value', (req, res) => VehicleData.getVehicleValue(req, res, 'GET'))

app.post('/value', (req, res) => VehicleData.getVehicleValue(req, res, 'POST'))

module.exports = app