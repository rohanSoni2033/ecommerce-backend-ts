import { Db, MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://127.0.0.1:27017');

let _database: Db | undefined;

export const connectDB = async () => {
  try {
    const client = await mongoClient.connect();
    console.log('🚀 Connected to the database');
    _database = client.db('ecommerce');
  } catch (err: any) {
    console.log(err.message);
  }
};

const db = (): Db => {
  if (!_database) {
    throw new Error('Failed to connect to the database');
  }
  return _database;
};

export default db;
