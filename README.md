## NestJS + PostgreSQL app for car sharing

A backend app to cover some aspects of car sharing functionality:

1. Tech stack is NestJS, Typescript, Postgres, Jest, Docker
2. Calculation of renting a car for a specific date range
3. Start and close of sessions for car renting
4. Getting stats for specific car and specific date range, or all cars and specific date range
5. Handling cases when mileage limit and/or rent period limit are exceeded 

## Requirements

#### To start API:

[Docker](https://www.docker.com/)

#### To start tests:

[Node v16](https://nodejs.org/en/download/)


## Setup

Create .env file based on .env.example
You can also configure error/success messages in /src/stringConsts.ts
Import ./test_auto_sharing.json to your Postman Collection for testing endpoints.

## Running the app

```bash
# Building Container
$ docker-compose build

# Running
$ docker-compose up
```

## Running the tests
````
npm i 
npm run test
````
##Seed
DB is already seeded with: <br>
Cars (id:number 1-5), <br>
Rates (id:number 1-3), <br>
Discounts (id:number 1-3), <br>
Sessions (dates from 2022-02-01 to 2022-02-28, cars in use have id 1 and 2)


## Endpoints
#### URL://hostname:port/api/cost/? METHOD - GET
Requires below data in query parameters:
````
date_start: Date;
date_end: Date;
car_id: number;
mileagePerDay: number;
Date format allowed YYYY-MM-DD (expecting dates have valid format from frontEnd datepickers)
````
Expecting responses:

httpstatus 200 success - rent price (number) for car in date range with calculated tax/discount %

httpstatus 409 error : string
- a) CAN'T START SESSION ON WEEKEND - NOBODY IN OFFICE when date_start is weekend
- b) CAN'T CLOSE SESSION ON WEEKEND - NOBODY IN OFFICE when date_end is weekend
- c) SESSION LASTS MORE THAN 30 DAYS - date range is too big (more than 30 days)
- d) CAR DOESN'T EXIST - car_id is not valid
- e) CAR IS BOOKED - car is not available
- f) 3 DAYS DIDN'T PASS. CAR CAN'T BE BOOKED - car was in use less than 3 days ago

#### URL://hostname:port/api/session METHOD - POST
Requires below data in request body:
````
car_id: number;
date_start: Date;
date_end: Date;
rate_id: number;
Date format allowed YYYY-MM-DD (expecting dates have valid format from frontEnd datepickers)
````
Expecting responses:

httpstatus 201 success:string - SUCCESSFUL SESSION START - session successfully started -
````
car marked as in_work, new session row appears in table Sessions, no calculations in this phase
````
httpstatus 409 error : string
- a) CAN'T START SESSION ON WEEKEND - NOBODY IN OFFICE when date_start is weekend
- b) CAN'T CLOSE SESSION ON WEEKEND - NOBODY IN OFFICE when date_end is weekend
- c) SESSION LASTS MORE THAN 30 DAYS. - date range is too big (more than 30 days)
- d) CAR DOESN'T EXIST - car_id is not valid
- e) CAR IS BOOKED - car is not available
- f) 3 DAYS DIDN'T PASS. CAR CAN'T BE BOOKED - car was in use less than 3 days ago

#### URL://hostname:port/api/session METHOD - PUT
Requires below data in request body:
````
mileage: number;
date_end: Date;
car_id: number;
Date format allowed YYYY-MM-DD (expecting dates have valid format from frontEnd datepickers)
````
Expecting responses:

httpstatus 200 success:string - SUCCESSFUL SESSION CLOSE - session successfully closed - 
````
session was found, marked as inactive, price was calculated with tax and discount, car marked as free
````
httpstatus 409 error : string

- a) ACTIVE SESSION NOT FOUND. - car with this id is not in work, active session not found
````
- session not closed
````
- b) CAN'T CLOSE SESSION ON WEEKEND - NOBODY IN OFFICE when date_end is weekend
````
- session not closed
````
- d) SESSION CLOSE WITH FINES - session is closed with fines 
````
session was found, marked as inactive and with fine, price was calculated with maximum rate, without discount, car marked as free,
Optional -  
  excess_days - fulfilled
  excess_km - fulfilled
````

#### URL://hostname:port/api/stats/? METHOD - GET
Requires below data in query parameters:
````
date_end: Date;
date_start: Date;
car_id?: number;
Date format allowed YYYY-MM-DD (expecting dates have valid format from frontEnd datepickers)
````

Returns array type of 
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