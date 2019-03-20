const requestvalidator  = require('../utils/requestvalidator')

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

class VehicleData {
    getVehicleValue(req, res, method) {
        let REQUEST_PARAMS

        if(method === 'GET'){
            REQUEST_PARAMS    = {
                initialValue:       req.query.value,
                vehiclemake:        req.query.make,
                vehiclemodel:       req.query.model,
                vehicleage:         req.query.age,
                vehicleowners:      req.query.owners,
                vehiclemileage:     req.query.mileage,
                vehiclecollisions:  req.query.collisions
            }
        } else if (method === 'POST'){
            REQUEST_PARAMS = {
                initialValue:       req.body.value,
                vehiclemake:        req.body.make,
                vehiclemodel:       req.body.model,
                vehicleage:         req.body.age,
                vehicleowners:      req.body.owners,
                vehiclemileage:     req.body.mileage,
                vehiclecollisions:  req.body.collisions
            }
        }

        requestvalidator.validateRequest(REQUEST_PARAMS, (err)=>{
            if(err){
                res.status(err.statusCode).send({status: err.status, errors: err.errors})
            } else {
                let vehicleValue =  this.calculateVehicleValue(REQUEST_PARAMS)

                let restResponse = {
                    status: 'SUCCESS',
                    request: REQUEST_PARAMS,
                    vehicleValue: vehicleValue
                }

                res.status(200).send(restResponse)
            }
        })
    }

    calculateVehicleValue(REQUEST_PARAMS){
        // Calculate new vehicle value
        let VEHICLE_VALUE       = REQUEST_PARAMS.initialValue
        let DROP_PER_AGE        = 0
        let DROP_PER_MILEAGE    = 0
        let DROP_PER_COLLISION  = 0

        // *** Step 1 ***
        // * calculate owners (first rule)
        // *
        // * If the car has had more than 2 previous owners, reduce its initial value by twenty-five (25) percent before applying other value alterations.

        if(REQUEST_PARAMS.vehicleowners > REDUCE_VALUE_MIN_OWNERS){
            VEHICLE_VALUE -= ((VEHICLE_VALUE/100) * REDUCE_VALUE_PER_OWNERS)
        }


        // *** Step 2 ***
        // * calculate age
        // *
        // * Given the number of months of how old the car is, reduce its value one-half (0.5) percent.
        // * After 10 years, it's value cannot be reduced further by age. This is not cumulative.

        let vehicleAge = REQUEST_PARAMS.vehicleage > REDUCE_VALUE_PER_AGE_TOTAL_MONTHS ? REDUCE_VALUE_PER_AGE_TOTAL_MONTHS : REQUEST_PARAMS.vehicleage
        DROP_PER_AGE = (VEHICLE_VALUE/100) * (vehicleAge * REDUCE_VALUE_PER_AGE)


        // *** Step 3 ***
        // * calculate mileage
        // *
        // * Given the vehicle’s mileage, reduce its value by one-fifth of a percent (0.2) for every 1,000 miles.
        // * After 150,000 miles, it's value cannot be reduced further by miles.  Do not consider any remaining miles.

        if(REQUEST_PARAMS.vehiclemileage){
            let vehicleMileage = REQUEST_PARAMS.vehiclemileage > REDUCE_VALUE_TOTAL_MILES ? REDUCE_VALUE_TOTAL_MILES : REQUEST_PARAMS.vehiclemileage

            DROP_PER_MILEAGE = (VEHICLE_VALUE/100) * (parseInt(vehicleMileage/REDUCE_VALUE_MILES) * REDUCE_VALUE_PER_MILEAGE)
        }


        // *** Step 4 ***
        // * calculate collisions
        // *
        // * For every reported collision the car has been in, remove two (2) percent of its value, up to five (5) collisions.

        if(REQUEST_PARAMS.vehiclecollisions){
            let vehicleCollisions = REQUEST_PARAMS.vehiclecollisions > REDUCE_VALUE_MAX_COLLISIONS ? REDUCE_VALUE_MAX_COLLISIONS : REQUEST_PARAMS.vehiclecollisions

            DROP_PER_COLLISION = (VEHICLE_VALUE/100) * (vehicleCollisions * REDUCE_VALUE_PER_COLLISION)
        }

        // preliminary calculation
        VEHICLE_VALUE -= (DROP_PER_AGE + DROP_PER_MILEAGE + DROP_PER_COLLISION)


        // *** Step 5 ***
        // * calculate owners (second rule)
        // *
        // * If the car has had no previous owners, add ten (10) percent to the final value, after all other value alterations.

        if(REQUEST_PARAMS.vehicleowners === 0){
            VEHICLE_VALUE += ((VEHICLE_VALUE/100) * RAISE_VALUE_NO_PREVIOUS_OWNER)
        }


        // *** Step Final ***
        // * return response

        return VEHICLE_VALUE
    }
}

module.exports = new VehicleData()
