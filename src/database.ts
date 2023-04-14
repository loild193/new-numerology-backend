import mongoose from 'mongoose'
import config from './config'

const connection = `mongodb://${config.mongoDbUsername}:${config.mongoDbPassword}@${config.mongoDbHost}:${config.mongoDbPort}/${config.mongoDbDatabase}?authSource=admin`

const initializeDBConnection = () => {
  let connectOptions: Record<string, any> = {}
  mongoose.connect(connection, connectOptions)

  mongoose.connection.once('open', () => {
    console.log(`Connected to ${config.mongoDbHost}:${config.mongoDbPort}/${config.mongoDbDatabase} database`)
  })

  mongoose.connection.on('error', console.log)
}

export default initializeDBConnection
