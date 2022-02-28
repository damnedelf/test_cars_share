#!/bin/sh


Timeout=10 # 30 minutes


# start the timeout monitor in
# background and pass the PID:


  npm run migrate:tables
  npm run seed:required
  npm run seed:sessions



#"if [ "$NODE_ENV" == "production" ] ; then
#  npm run start
#else
#  npm run migrate:tables
#  npm run seed:required
#  npm run seed:sessions
#fi"