# vehiclevalue
Returns json data about used car value.

* URL
```$xslt
/value
```

* Method:
```$xslt
GET
```

* URL Params

   Required:
```$xslt
value=[integer]
make=[string]
model=[string]
age=[integer]
owners=[integer]
```
         
   Optional:
      
```$xslt
collisions=[integer]
mileage=[integer]

```

* Method:
```$xslt
POST
```

* Request body

   Required:
```$xslt
{
    "value": [integer],
    "make": [string],
    "model": [string],
    "age": [integer],
    "owners": [integer]
}
```
         
   Optional:
      
```$xslt
{
    "collisions": [integer]
    "mileage": [integer]
}

```

* Success Response:
```$xslt
Code: 200 
Content: {
            "status": "SUCCESS",
            "request": {
                "initialValue": "20000",
                "vehicleMake": "toyota",
                "vehicleModel": "highlander",
                "vehicleAge": "12",
                "vehicleOwners": "3",
                "vehicleMileage": "1001",
                "vehicleCollisions": "5"
             },
             "vehicleValue": 12570
         }
```

* Error Response:
```$xslt
Code: 400 Bad Request
Content: {
         "status": "FAILURE",
             "errors": [
                "value parameter should be numeric",
                "make parameter missing"
             ]
         }
```

* Sample GET Call:

 ```$xslt
/value?value=20000&make=toyota&model=highlander&age=12&owners=3&collisions=5&mileage=1001
```

* Sample POST Call:

 ```$xslt
{
    "value": "20000",
    "make": "toyota",
    "model": "highlander",
    "age": "12",
    "owners": "3",
    "collisions": "5",
    "mileage": "5000"
}
```