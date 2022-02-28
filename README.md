## Test App Car Sharing

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Requirments



Docker


## Setup

Create .env file based on .env.example
You can also configurate error/success messages in /src/stringConsts.ts
P.S.> For now most of success messages are not usefull but can be used later.
P.P.S> Use test_auto_sharing.json as Postman Collection for test

## Running the app

```bash
# Building Container
$ docker-compose build

# Running
$ docker-compose up
```
##Seed
DB is already seeded with
Cars (id:number 1-5),
Rates(id:number 1-3), 
Discounts(id:number 1-3), 
Sessions (Dates from 2022-02-01 to 2022-02-28, cars in usage id 1-2)


## Endpoints
#### URL://hostname:port/api/cost/?  METHOD - GET
Requires below data in query parameters:
````
date_start: Date;
date_end: Date;
car_id: number;
mileagePerDay: number;
Date format allowed YYYY-MM-DD or YYYY-MM-DD HH:mm:ss (expecting dates have valid format from frontEnd datepickers)
````
Expecting responses:

httpstatus 200 success - rent price (number) for car in date range with calculated tax/discount %

httpstatus 409 error  : string
- a) CAN'T START SESSION ON WEEKAND - NOBODY IN OFFICE when date_start is weekend
- b) CAN'T CLOSE SESSION ON WEEKAND - NOBODY IN OFFICE when date_end is weekend
- c) SESSION LAST MORE THAN 30 DAYS. - date range is too big (more than 30 days)
- d) CAR DOESN'T EXISTS - car_id is not valid
- e) CAR IS BOOKED - car is not free right now
- f) 3 DAYS DIDN'T PASS. CAR CANNOT BE BOOKED - car was in use less than 3 days ago

#### URL://hostname:port/api/session  METHOD - POST
Requires below data in request body:
````
car_id: number;
date_start: Date;
date_end: Date;
rate_id: number;
Date format allowed YYYY-MM-DD or YYYY-MM-DD HH:mm:ss (expecting dates have valid format from frontEnd datepickers)
````
Expecting responses:

httpstatus 201 success:string  - SUCCESSFUL SESSION START  - session successfully started -
````
car marked as in_work, new session row in table Sessions appears, no calculations on this phase
````
httpstatus 409 error  : string
- a) CAN'T START SESSION ON WEEKAND - NOBODY IN OFFICE when date_start is weekend
- b) CAN'T CLOSE SESSION ON WEEKAND - NOBODY IN OFFICE when date_end is weekend
- c) SESSION LAST MORE THAN 30 DAYS. - date range is too big (more than 30 days)
- d) CAR DOESN'T EXISTS - car_id is not valid
- e) CAR IS BOOKED - car is not free right now
- f) 3 DAYS DIDN'T PASS. CAR CANNOT BE BOOKED - car was in use less than 3 days ago

#### URL://hostname:port/api/session  METHOD - PUT
Requires below data in request body:
````
mileage: number;
date_end: Date;
car_id: number;
Date format allowed YYYY-MM-DD or YYYY-MM-DD HH:mm:ss (expecting dates have valid format from frontEnd datepickers)
````
Expecting responses:

httpstatus 200 success:string  - SUCCESSFUL SESSION CLOSE  - session successfully closed -  
````
session was found, marked as inactive, price was calculated with tax and discount, car marked as free
````
httpstatus 409 error  : string

- a) ACTIVE SESSION NOT FOUND. - car with this id is not in work, active session not found
````
- session not closed
````
- b) CAN'T CLOSE SESSION ON WEEKAND - NOBODY IN OFFICE when date_end is weekend
````
- session not closed
````
- d) SESSION CLOSE WITH FINES - session is closed with fines 
````
session was found, marked as inactive and with fine, price was calculated with maximal tax, without discount, car marked as free,
Optional -   
   excess_days  - fulfilled
   excess_km - fulfilled
````

#### URL://hostname:port/api/stats/?  METHOD - GET
Requires below data in query parameters:
````
date_end: Date;
date_start: Date;
car_id?: number;
Date format allowed YYYY-MM-DD or YYYY-MM-DD HH:mm:ss (expecting dates have valid format from frontEnd datepickers)
````

Returnes array type of 
````
[..., 
day: {
  id: number;
  summ?: number;
  excess_days?: number;
  excess_km?: number;
  fine: boolean;
  date_start: Date;
  date_end?: Date;
  mileage?: number;
  car_id: number;
  tax_id: number;
  discount_id: number;
  }[]
]
````

Or empty Array