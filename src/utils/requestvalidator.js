const validator     = require('validator')
const request       = require('request')

const DMV_API_URL           = 'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/'
const DMV_MAKE_MODEL_ERROR  = 'not known make/model to the U.S. DEPARTMENT OF TRANSPORTATION'

class RequestValidator{
    validateRequest(requesData, callback) {
        let requestErrors       = []

        try {
            if(!requesData.initialValue){
                requestErrors.push('value parameter missing')
            } else if(!validator.isNumeric(requesData.initialValue)) {
                requestErrors.push('value parameter should be numeric')
            } else if(requesData.initialValue<=0) {
                requestErrors.push('invalid initial vehicle value parameter')
            }
            if(!requesData.vehicleage){
                requestErrors.push('age (months) parameter missing')
            } else if(!validator.isNumeric(requesData.vehicleage, {no_symbols: true})){
                requestErrors.push('age (months) parameter should be numeric')
            } else if(requesData.vehicleage<0){
                requestErrors.push(`invalid vehicle age parameter: ${requesData.vehicleage}`)
            }
            if(!requesData.vehicleowners){
                requestErrors.push('owners parameter missing')
            } else if(!validator.isNumeric(requesData.vehicleowners, {no_symbols: true})){
                requestErrors.push('owners parameter should be numeric')
            } else if(requesData.vehicleowners<0){
                requestErrors.push(`invalid owners parameter: ${requesData.vehicleowners}`)
            }

            if(requesData.vehiclemileage){
                if(!validator.isNumeric(requesData.vehiclemileage)) {
                    requestErrors.push('mileage parameter should be numeric')
                } else if(requesData.vehiclemileage<0) {
                    requestErrors.push(`invalid mileage parameter: ${requesData.vehiclemileage}`)
                }
            }

            if(requesData.vehiclecollisions){
                if(!validator.isNumeric(requesData.vehiclecollisions, {no_symbols: true})) {
                    requestErrors.push('collisions parameter should be numeric')
                } else if(requesData.vehiclecollisions<0) {
                    requestErrors.push(`invalid collisions parameter: ${requesData.vehiclecollisions}`)
                }
            }

            if(!requesData.vehiclemake){
                requestErrors.push('make parameter missing')
            }
            if(!requesData.vehiclemodel){
                requestErrors.push('model parameter missing')
            }

            if(requesData.vehiclemake && requesData.vehiclemodel){
                this.validateMakeModel(requesData.vehiclemake, requesData.vehiclemodel)
                .then((data)=>{
                    if(data.makeModelValid === false){
                        requestErrors.push(DMV_MAKE_MODEL_ERROR, data.make, data.model)
                    }

                    if(requestErrors.length>0){
                        callback({statusCode: 400, status: 'FAILURE', errors: requestErrors})
                    } else {
                        callback(undefined)
                    }
                })
                .catch((error)=>{
                    console.log(error)
                    requestErrors.push('unable to obtain make/model from DMV')
                    callback({statusCode: 400, status: 'FAILURE', errors: requestErrors})
                })
            } else {
                callback({statusCode: 400, status: 'FAILURE', errors: requestErrors})
            }

        } catch (err) {
            callback({statusCode: 500, status: 'FAILURE', errors: [`Internal Service Error: ${err}`]})
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
}

module.exports = new RequestValidator()