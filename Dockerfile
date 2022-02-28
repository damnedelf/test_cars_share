FROM node:16-alpine3.14

WORKDIR /app

COPY ./package*.json ./

RUN npm install
#RUN #npm build
COPY . .

EXPOSE 3000
COPY ./docker_postgres_init.sql /docker-entrypoint-initdb.d/docker_postgres_init.sql
CMD ["npm", "run", "start:dev"]
CMD ["docker-entrypoint.sh", "postgres"]
