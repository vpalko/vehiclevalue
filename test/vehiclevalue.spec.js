let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../src/server')
let should = chai.should()
var expect = chai.expect

chai.use(chaiHttp)

describe('get vehicle value', function() {
    //start server
    this.timeout(60000);

    it('get vehicle value', function(done) {
        chai.request(server)
        .get('/value?value=20000&make=toyota&model=highlander&age=12&owners=3&collisions=5&mileage=1001')
        .end((err, res) => {
            res.body.should.have.status('SUCCESS')
            res.body.should.be.a('object')
            res.body.should.have.property('status')
            res.body.should.have.property('request')
            res.body.should.have.property('vehicleValue')

            done()
        })
    })

    it('check mileage parameter is optional', function(done) {
        chai.request(server)
        .get('/value?value=20000&make=toyota&model=highlander&age=12&owners=3&collisions=5')
        .end((err, res) => {
            res.body.should.have.status('SUCCESS')
            res.body.should.be.a('object')
            res.body.should.have.property('status')
            res.body.should.have.property('request')
            res.body.should.have.property('vehicleValue')

            done()
        })
    })

    it('check mileage parameter is a number', function(done) {
        chai.request(server)
        .get('/value?age=1w2&mileage=10s01')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['mileage parameter should be numeric'])

            done()
        })
    })

    it('check collisions parameter is optional', function(done) {
        chai.request(server)
        .get('/value?value=20000&make=toyota&model=highlander&age=12&owners=3')
        .end((err, res) => {
            res.body.should.have.status('SUCCESS')
            res.body.should.be.a('object')
            res.body.should.have.property('status')
            res.body.should.have.property('request')
            res.body.should.have.property('vehicleValue')

            done()
        })
    })

    it('check collisions parameter is a number', function(done) {
        chai.request(server)
        .get('/value?age=1w2&collisions=10s01')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['collisions parameter should be numeric'])

            done()
        })
    })

    it('check value parameter is required', function(done) {
        chai.request(server)
        .get('/value?make=toyota&model=highlander&age=12&owners=3')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['value parameter missing'])

            done()
        })
    })

    it('check value parameter is a number', function(done) {
        chai.request(server)
        .get('/value?value=200a00&make=toyota&model=highlander&age=12&owners=3')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['value parameter should be numeric'])

            done()
        })
    })

    it('check make parameter is required', function(done) {
        chai.request(server)
        .get('/value?model=highlander&age=12&owners=3')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['make parameter missing'])

            done()
        })
    })

    it('check model parameter is required', function(done) {
        chai.request(server)
        .get('/value?age=12&owners=3')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['model parameter missing'])

            done()
        })
    })

    it('check age parameter is required', function(done) {
        chai.request(server)
        .get('/value?owners=3')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['age (months) parameter missing'])

            done()
        })
    })

    it('check age parameter is a number', function(done) {
        chai.request(server)
        .get('/value?age=1w2&owners=3')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['age (months) parameter should be numeric'])

            done()
        })
    })

    it('check owners parameter is required', function(done) {
        chai.request(server)
        .get('/value')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['owners parameter missing'])

            done()
        })
    })

    it('check owners parameter is a number', function(done) {
        chai.request(server)
        .get('/value?owners=e3')
        .end((err, res) => {
            res.body.should.have.status('FAILURE')
            res.body.should.be.a('object')
            res.body.should.have.property('errors')
            expect(res.body.errors).to.include.members(['owners parameter should be numeric'])

            done()
        })
    })

    after(function () {
        process.exit();
    })
})

