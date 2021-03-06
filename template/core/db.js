import knex from 'knex';
import config from '../src/config';

var db;

export default function getDb() {
    return db || getDb.reconnect();
}

getDb.reconnect = function() {
    db = knex(config.db);
    return db;
};
