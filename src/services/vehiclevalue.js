const validator = require('validator')
const request   = require('request')

const DMV_API_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/'

const REDUCE_VALUE_PER_AGE              = .5
const REDUCE_VALUE_PER_AGE_TOTAL_MONTHS = 10 * 12 // 10 - max years

const REDUCE_VALUE_PER_MILEAGE          = .2
const REDUCE_VALUE_MILES                = 1000
const REDUCE_VALUE_TOTAL_MILES          = 150000

const REDUCE_VALUE_MIN_OWNERS           = 2
const REDUCE_VALUE_PER_OWNERS           = 25
const RAISE_VALUE_NO_PREVIOUS_OWNER     = 10

const REDUCE_VALUE_PER_COLLISION        = 2
const REDUCE_VALUE_MAX_COLLISIONS       = 5

const DMV_MAKE_MODEL_ERROR              = 'not known make/model to the U.S. DEPARTMENT OF TRANSPORTATION'

class VehicleData {
    getVehicleValue(req, res) {
      const PARAM_VALUE       = req.query.value
      const PARAM_MAKE        = req.query.make
      const PARAM_MODEL       = req.query.model
      const PARAM_AGE         = req.query.age
      const PARAM_OWNERS      = req.query.owners
      const PARAM_MILEAGE     = req.query.mileage
      const PARAM_COLLISIONS  = req.query.collisions

      let requestErrors       = []

      try {
          // validate request parameters

          if(!PARAM_VALUE){
              requestErrors.push('value parameter missing')
          } else if(!validator.isNumeric(PARAM_VALUE)) {
              requestErrors.push('value parameter should be numeric')
          } else if(PARAM_VALUE<=0) {
              requestErrors.push('invalid initial vehicle value parameter')
          }
          if(!PARAM_AGE){
              requestErrors.push('age (months) parameter missing')
          } else if(!validator.isNumeric(PARAM_AGE, {no_symbols: true})){
              requestErrors.push('age (months) parameter should be numeric')
          } else if(PARAM_AGE<0){
              requestErrors.push(`invalid vehicle age parameter: ${PARAM_AGE}`)
          }
          if(!PARAM_OWNERS){
              requestErrors.push('owners parameter missing')
          } else if(!validator.isNumeric(PARAM_OWNERS, {no_symbols: true})){
              requestErrors.push('owners parameter should be numeric')
          } else if(PARAM_OWNERS<0){
              requestErrors.push(`invalid owners parameter: ${PARAM_OWNERS}`)
          }

          if(PARAM_MILEAGE){
              if(!validator.isNumeric(PARAM_MILEAGE)) {
                  requestErrors.push('mileage parameter should be numeric')
              } else if(PARAM_MILEAGE<0) {
                  requestErrors.push(`invalid mileage parameter: ${PARAM_MILEAGE}`)
              }
          }

          if(PARAM_COLLISIONS){
              if(!validator.isNumeric(PARAM_COLLISIONS, {no_symbols: true})) {
                  requestErrors.push('collisions parameter should be numeric')
              } else if(PARAM_COLLISIONS<0) {
                  requestErrors.push(`invalid collisions parameter: ${PARAM_COLLISIONS}`)
              }
          }

          if(!PARAM_MAKE){
              requestErrors.push('make parameter missing')
          }
          if(!PARAM_MODEL){
              requestErrors.push('model parameter missing')
          }

          if(PARAM_MAKE && PARAM_MODEL){
              this.validateMakeModel(PARAM_MAKE, PARAM_MODEL)
              .then((data)=>{
                  if(data.makeModelValid === false){
                    requestErrors.push(DMV_MAKE_MODEL_ERROR, data.make, data.model)
                  }

                  if(requestErrors.length>0){
                        return res.status(400).send({status: 'FAILURE', errors: requestErrors})
                  } else {
                        let vehicleValue =  this.calculateVehicleValue(
                             PARAM_VALUE,
                             PARAM_MAKE,
                             PARAM_MODEL,
                             PARAM_AGE,
                             PARAM_OWNERS,
                             PARAM_MILEAGE,
                             PARAM_COLLISIONS
                        )

                        let restResponse = {
                            status: 'SUCCESS',
                            request: {
                                initialValue: PARAM_VALUE,
                                vehicleMake: PARAM_MAKE,
                                vehicleModel: PARAM_MODEL,
                                vehicleAge: PARAM_AGE,
                                vehicleOwners: PARAM_OWNERS,
                                vehicleMileage: PARAM_MILEAGE,
                                vehicleCollisions: PARAM_COLLISIONS
                            },
                            vehicleValue: vehicleValue
                        }

                      res.status(200).send(restResponse)
                  }
              })
              .catch((error)=>{
                  console.log(error)
                  requestErrors.push('unable to obtain make/model from DMV')
                  return res.status(400).send({status: 'FAILURE', errors: requestErrors})
              })
          } else {
              return res.status(400).send({status: 'FAILURE', errors: requestErrors})
          }

      } catch (err) {
          return res.status(500).send({status: 'FAILURE', errors: [`Internal Service Error: ${err}`]})
      }
    }

    validateMakeModel(make, model) {
        return new Promise(function (resolve, reject) {
            request({url: DMV_API_URL + make + '?format=json'}, (error, response)=>{
                let dmvResponse = JSON.parse(response.body)

                if(error) {
                    reject({error: error})

                } else if (dmvResponse.Results.length<=0){
                    resolve({make: make, model: model, makeModelValid: false})

                } else {
                    let modelFound = dmvResponse.Results.filter(function(item) {
                        return item.Model_Name.toUpperCase() === model.toUpperCase()
                    })

                    resolve({make: make, model: model, makeModelValid: modelFound.length>0})
                }
            })
        })
    }

    calculateVehicleValue(
        init_VALUE,
        vehicle_MAKE,
        vehicle_MODEL,
        vehicle_AGE,
        vehicle_OWNERS,
        vehicle_MILEAGE,
        vehicle_COLLISIONS
    ){
        // Calculate new vehicle value
        let VEHICLE_VALUE       = init_VALUE
        let DROP_PER_AGE        = 0
        let DROP_PER_MILEAGE    = 0
        let DROP_PER_COLLISION  = 0

        // *** Step 1 ***
        // * calculate owners (first rule)
        // *
        // * If the car has had more than 2 previous owners, reduce its initial value by twenty-five (25) percent before applying other value alterations.

        if(vehicle_OWNERS > REDUCE_VALUE_MIN_OWNERS){
            VEHICLE_VALUE -= ((VEHICLE_VALUE/100) * REDUCE_VALUE_PER_OWNERS)
        }


        // *** Step 2 ***
        // * calculate age
        // *
        // * Given the number of months of how old the car is, reduce its value one-half (0.5) percent.
        // * After 10 years, it's value cannot be reduced further by age. This is not cumulative.

        let vehicleAge = vehicle_AGE > REDUCE_VALUE_PER_AGE_TOTAL_MONTHS ? REDUCE_VALUE_PER_AGE_TOTAL_MONTHS : vehicle_AGE
        DROP_PER_AGE = (VEHICLE_VALUE/100) * (vehicleAge * REDUCE_VALUE_PER_AGE)


        // *** Step 3 ***
        // * calculate mileage
        // *
        // * Given the vehicle’s mileage, reduce its value by one-fifth of a percent (0.2) for every 1,000 miles.
        // * After 150,000 miles, it's value cannot be reduced further by miles.  Do not consider any remaining miles.

        if(vehicle_MILEAGE){
            let vehicleMileage = vehicle_MILEAGE > REDUCE_VALUE_TOTAL_MILES ? REDUCE_VALUE_TOTAL_MILES : vehicle_MILEAGE

            DROP_PER_MILEAGE = (VEHICLE_VALUE/100) * (parseInt(vehicleMileage/REDUCE_VALUE_MILES) * REDUCE_VALUE_PER_MILEAGE)
        }


        // *** Step 4 ***
        // * calculate collisions
        // *
        // * For every reported collision the car has been in, remove two (2) percent of its value, up to five (5) collisions.

        if(vehicle_COLLISIONS){
            let vehicleCollisions = vehicle_COLLISIONS > REDUCE_VALUE_MAX_COLLISIONS ? REDUCE_VALUE_MAX_COLLISIONS : vehicle_COLLISIONS

            DROP_PER_COLLISION = (VEHICLE_VALUE/100) * (vehicleCollisions * REDUCE_VALUE_PER_COLLISION)
        }

        // preliminary calculation
        VEHICLE_VALUE -= (DROP_PER_AGE + DROP_PER_MILEAGE + DROP_PER_COLLISION)


        // *** Step 5 ***
        // * calculate owners (second rule)
        // *
        // * If the car has had no previous owners, add ten (10) percent to the final value, after all other value alterations.

        if(vehicle_OWNERS === 0){
            VEHICLE_VALUE += ((VEHICLE_VALUE/100) * RAISE_VALUE_NO_PREVIOUS_OWNER)
        }


        // *** Step Final ***
        // * return response

        return VEHICLE_VALUE
    }
}

module.exports = new VehicleData()
