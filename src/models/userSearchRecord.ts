import mongoose from 'mongoose'

export type TUserSearchRecord = {
  id: string
  userId: number
  name: string
  birthday: number
  phone: string
  company: string
  createdAt: number // second
  updatedAt: number // second
  deletedAt: number // second
  createdBy: number // userId
  updatedBy: number // userid
}

const UserSearchRecordSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      unique: true,
      required: true,
    },
    birthday: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    company: {
      type: String,
      unique: true,
      required: true,
    },
    createdAt: {
      type: Number,
      default: Math.floor(new Date().getTime() / 1000),
    },
    updatedAt: {
      type: Number,
      default: Math.floor(new Date().getTime() / 1000),
    },
    deletedAt: {
      type: Number,
      default: null,
    },
  },
  {
    collection: 'userSearchRecord',
    versionKey: false,
  },
)

export const UserSearchRecordModel = mongoose.model<TUserSearchRecord>('user', UserSearchRecordSchema)
