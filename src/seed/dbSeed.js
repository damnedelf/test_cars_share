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
  await pool.query(`INSERT INTO cars(brand,model,vin,number)VALUES 
 ('LADA','Vesta 1.6','4Y1SL65848Z411439','A123BC 111RUS'),
 ('KIA','Soul 2.0','4Y1SL65848Z411438','A456BC 121RUS'),
 ('HONDA','CRV 2.4','4Y1SL65848Z411437','A789BC 131RUS'),
 ('HYUNDAI','GETZ 1.1','4Y1SL65848Z411436','A012BC 141RUS'),
 ('GEELY','ATLAS 2.4','4Y1SL65848Z411435','A345BC 151RUS');
 `);
  await pool.query(`INSERT INTO rates(cost,mileage) VALUES
(270,200),
(330,350),
(390,500);
`);
  await pool.query(`INSERT INTO discounts(min,max,discount_percent) VALUES
(3,5,5),
(6,14,10),
(15,30,15);
`);
  await pool.end();
};
seedAll();
// export default seedAll;
