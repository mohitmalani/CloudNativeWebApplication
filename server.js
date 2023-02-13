const app = require('./api');
const pool = require('./database');

// assign port
const port = 3000;

app.listen(port, () => {
    console.log(`listning on 3000`)
});

pool.connect((err) => {
    if (err) throw err;
    pool.query('CREATE TABLE IF NOT EXISTS public.healthz(id character varying(255) COLLATE pg_catalog."default" NOT NULL,first_name character varying(255) COLLATE pg_catalog."default" NOT NULL,last_name character varying(255) COLLATE pg_catalog."default" NOT NULL,password character varying(255) COLLATE pg_catalog."default" NOT NULL,username character varying(255) COLLATE pg_catalog."default" NOT NULL,account_created timestamp without time zone NOT NULL,account_updated timestamp without time zone NOT NULL,CONSTRAINT users_pkey PRIMARY KEY (id),CONSTRAINT users_username_key UNIQUE (username));',
        function (error, result) {
            console.log(result);
        });
});

pool.connect((err) => {
    if (err) throw err;
    pool.query('CREATE TABLE IF NOT EXISTS public.images(id character varying(500) COLLATE pg_catalog."default",user_id character varying(500) COLLATE pg_catalog."default",url character varying(500) COLLATE pg_catalog."default",upload_date timestamp without time zone,file_name character varying(500) COLLATE pg_catalog."default");',
        function (error, result) {
            console.log(result);
        });
});