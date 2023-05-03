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
  updatedBy: string // userId
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
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    birthday: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    company: {
      type: String,
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

export const UserSearchRecordModel = mongoose.model<TUserSearchRecord>('user_search_record', UserSearchRecordSchema)
