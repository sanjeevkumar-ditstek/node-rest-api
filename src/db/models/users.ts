import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import Status from '../../utils/enum/status';
import LoginSource from '../../utils/enum/loginSource';
import IROLE from './roles';

// Interface definition (you already have this)
export default interface IUSER extends Document {
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  role?: string;
  profile_pic?: string;
  login_source?: string;
  google_token?: string;
  apple_token?: string;
  facebook_token?: string;
  status?: number;
  isSuperAdmin?: boolean;
  roles?: IROLE[];
}

// Define the User schema
const UserSchema: Schema<IUSER> = new Schema<IUSER>(
  {
    firstname: {
      type: String,
      default: null
    },
    lastname: {
      type: String,
      default: null
    },
    email: {
      type: String,
    },
    password: {
      type: String,
      default: null,
      select: false  // Don't return the password field by default in queries
    },
    profile_pic: {
      type: String
    },
    login_source: {
      type: String,
      enum: [LoginSource.EMAIL, LoginSource.APPLE, LoginSource.GOOGLE],
      default: LoginSource.EMAIL
    },
    google_token: {
      type: String
    },
    facebook_token: {
      type: String
    },
    apple_token: {
      type: String
    },
    status: {
      type: Number,
      default: Status.ACTIVE,
      enum: [Status.ACTIVE, Status.INACTIVE, Status.DELETED]
    },
    isSuperAdmin: {
      type: Boolean,
      default: false
    },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'roles' }],

  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUSER>('save', async function (next) {
  if (!this.isModified('password')) return next();  // Only hash if the password is modified or new

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt with a complexity of 10
    const hashedPassword = await bcrypt.hash(this.password!, salt); // Hash the password
    this.password = hashedPassword;  // Assign the hashed password to the document
    next(); // Proceed with saving the document
  } catch (error) {
    next(error); // Pass any error to the next middleware
  }
});

// Define and export the model
export const UserModel = 
  (mongoose.models.User as mongoose.Model<IUSER>) ||
  mongoose.model<IUSER>('users', UserSchema);


