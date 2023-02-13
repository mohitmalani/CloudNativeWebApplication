#!/bin/bash
sleep 30

sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update -y
sudo apt-get install -y postgresql postgresql-contrib postgresql-client
sudo dpkg --status postgresql

sudo systemctl stop postgresql.service
sudo systemctl start postgresql.service
sudo systemctl enable postgresql.service
sudo systemctl status postgresql.service

sudo -u postgres psql <<EOF
\x
ALTER ROLE postgres WITH PASSWORD 'Myneu@123';
CREATE DATABASE "postgres";
\connect postgres
CREATE EXTENSION "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.healthz
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    first_name character varying(250) COLLATE pg_catalog."default" NOT NULL,
    last_name character varying(250) COLLATE pg_catalog."default" NOT NULL,
    username character varying(250) COLLATE pg_catalog."default" NOT NULL,
    password character varying(250) COLLATE pg_catalog."default" NOT NULL,
    account_created timestamp without time zone NOT NULL,
    account_updated timestamp without time zone NOT NULL,
    CONSTRAINT healthz_pkey PRIMARY KEY (id),
    CONSTRAINT healthz_first_name_key UNIQUE (first_name),
    CONSTRAINT healthz_last_name_key UNIQUE (last_name),
    CONSTRAINT healthz_username_key UNIQUE (username)
);
\q
EOF

sudo systemctl stop postgresql.service
sudo systemctl start postgresql.service
sudo systemctl status postgresql.service
