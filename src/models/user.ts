import mongoose from 'mongoose'

export enum ROLE {
  ADMIN = 1000,
  USER = 1,
}

export type TUser = {
  id: string
  userId: string
  email: string
  username: string
  password: string
  phone: string
  searchAmountLeft: number
  role: ROLE
  createdAt: Date // second
  updatedAt: Date // second
  deletedAt: number // second
  createdBy: string // userId
  updatedBy: string // userid
}

const UserSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      default: null,
    },
    username: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
    },
    searchAmountLeft: {
      type: Number,
    },
    role: {
      type: Number,
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
    collection: 'user',
    versionKey: false,
    timestamps: true,
  },
)

export const UserModel = mongoose.model<TUser>('user', UserSchema)
