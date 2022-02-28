CREATE DATABASE IF NOT EXISTS auto_sharing_test;
USE auto_sharing_test;

CREATE TABLE cars (
    id bigserial PRIMARY KEY,
    brand        varchar(20) NOT NULL,
    model       varchar(20) NOT NULL,
    vin          varchar(20) NOT NULL UNIQUE,
    number varchar(13) NOT NULL UNIQUE,
    in_work        boolean DEFAULT FALSE
    );

CREATE TABLE rates (
    id bigserial PRIMARY KEY,
    cost        integer NOT NULL,
    mileage       integer NOT NULL

);

CREATE TABLE discounts (
    id bigserial PRIMARY KEY,
    min        integer NOT NULL,
    max integer NOT NULL,
    discount_percent       integer NOT NULL

);

CREATE TABLE sessions (
   id bigserial PRIMARY KEY,
   is_active boolean DEFAULT FALSE,
   summ integer,
   excess_days integer,
   excess_km integer,
   fine boolean DEFAULT FALSE,
   date_start timestamp DEFAULT now(),
   date_end timestamp ,
   mileage integer ,
   car_id integer NOT NULL,
   rate_id integer ,
   discount_id integer ,
   FOREIGN KEY (car_id) REFERENCES cars(id),
   FOREIGN KEY (rate_id) REFERENCES rates(id),
   FOREIGN KEY (discount_id) REFERENCES discounts(id)
);

INSERT INTO cars(brand,model,vin,number)VALUES
 ('LADA','Vesta 1.6','4Y1SL65848Z411439','A123BC 111RUS'),
 ('KIA','Soul 2.0','4Y1SL65848Z411438','A456BC 121RUS'),
 ('HONDA','CRV 2.4','4Y1SL65848Z411437','A789BC 131RUS'),
 ('HYUNDAI','GETZ 1.1','4Y1SL65848Z411436','A012BC 141RUS'),
 ('GEELY','ATLAS 2.4','4Y1SL65848Z411435','A345BC 151RUS');

INSERT INTO rates(cost,mileage) VALUES
(270,200),
(330,350),
(390,500);

INSERT INTO discounts(min,max,discount_percent) VALUES
(3,5,5),
(6,14,10),
(15,30,15);

INSERT INTO sessions(is_active,summ,excess_days, excess_km,fine,date_start,date_end,mileage,car_id,rate_id,discount_id) VALUES
 (false,5000,0,0,false,'2022-02-01','2022-02-10',8000,1,2,3),
(false,1000,0,1000,true, '2022-02-14', '2022-02-28',3000,1,1,2),
(false,1333,5,0,false, '2022-02-01', '2022-03-10',8000,2,2,3),
(false,6666,0,0,false, '2022-02-15', '2022-02-19',1000,3,2,3),
(false,9999,0,0,false, '2022-02-01', '2022-02-20',3000,4,1,2);





