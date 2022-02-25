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

const seedAll = async () => {
  await pool.query(`INSERT INTO sessions(is_active,summ,excess_days, excess_km,fine,date_start,date_end,mileage,car_id,rate_id,discount_id) VALUES 
 (false,5000,0,0,false,'2022-02-01','2022-02-10',8000,1,2,3),
(false,1000,0,1000,true, '2022-02-14', '2022-02-28',3000,1,1,2),
(false,1333,5,0,false, '2022-02-01', '2022-03-10',8000,2,2,3),
(false,6666,0,0,false, '2022-02-15', '2022-02-19',1000,3,2,3),
(false,9999,0,0,false, '2022-02-01', '2022-02-20',3000,4,1,2);


 `);

  await pool.end();
};
seedAll();
