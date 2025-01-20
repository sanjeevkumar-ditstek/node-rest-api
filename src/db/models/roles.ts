import mongoose, { Schema, Document } from 'mongoose';
import IPERMISSION from './permissions';

export default interface IROLE extends Document {
  role: string;  // e.g., 'admin', 'subadmin', 'customer'
  level: number;
  permissions: IPERMISSION[];
}


const RoleSchema: Schema = new Schema({
  role: { type: String, required: true, unique: true },
  level: { type: Number },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'permissions', required: true }],
},{ timestamps: true });

// Define and export the model
export const RolesModel = mongoose.model<IROLE>('roles', RoleSchema);
