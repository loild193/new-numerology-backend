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
  createdAt: number // second
  updatedAt: number // second
  deletedAt: number // second
  createdBy: number // userId
  updatedBy: number // userid
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
      unique: true,
      index: true,
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
    createdBy: {
      type: Number,
      default: null,
    },
    updatedBy: {
      type: Number,
      default: null,
    },
  },
  {
    collection: 'user',
    versionKey: false,
  },
)

export const UserModel = mongoose.model<TUser>('user', UserSchema)
