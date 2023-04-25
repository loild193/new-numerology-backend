import mongoose from 'mongoose'

export type TUserSearchRecord = {
  id: string
  userId: number
  name: string
  birthday: number
  phone: string
  company: string
  createdAt: Date // second
  updatedAt: Date // second
  deletedAt: number // second
  createdBy: string // userId
  updatedBy: string // userid
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
    deletedAt: {
      type: Number,
      default: null,
    },
    createdBy: {
      type: String,
      default: null,
    },
    updatedBy: {
      type: String,
      default: null,
    },
  },
  {
    collection: 'userSearchRecord',
    versionKey: false,
    timestamps: true,
  },
)

export const UserSearchRecordModel = mongoose.model<TUserSearchRecord>('user', UserSearchRecordSchema)
