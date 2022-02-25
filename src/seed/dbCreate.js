// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const { DB_USER, DB_NAME, DB_PASSWORD, DB_PORT, DB_HOST } = process.env;

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: DB_PORT,
});

const createTables = async () => {
  // await pool.query('DROP DATABASE IF EXISTS auto_sharing;')
  // await pool.query('CREATE DATABASE auto_sharing;')
  await pool.query('DROP TABLE IF EXISTS sessions;');
  await pool.query('DROP TABLE IF EXISTS cars;');
  await pool.query('DROP TABLE IF EXISTS rates;');
  await pool.query('DROP TABLE IF EXISTS discounts;');

  await pool.query(
    `CREATE TABLE cars (
    id bigserial PRIMARY KEY,
    brand        varchar(20) NOT NULL,
    model       varchar(20) NOT NULL,
    vin          varchar(20) NOT NULL UNIQUE,
    number varchar(13) NOT NULL UNIQUE,
    in_work        boolean DEFAULT FALSE
);`,
  );
  await pool.query(
    `CREATE TABLE rates (
    id bigserial PRIMARY KEY,
    cost        integer NOT NULL,
    mileage       integer NOT NULL

);`,
  );
  await pool.query(
    `CREATE TABLE discounts (
    id bigserial PRIMARY KEY,
    min        integer NOT NULL,
    max integer NOT NULL,
    discount_percent       integer NOT NULL

);`,
  );
  await pool.query(
    `CREATE TABLE sessions (
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
);`,
  );
  await pool.end();
};
createTables();
// export default createTables;
