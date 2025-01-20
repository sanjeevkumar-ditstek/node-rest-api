import mongoose, { Schema, Document } from 'mongoose';
import IMODULE from './modules';
export default interface IPERMISSION extends Document {
    module: IMODULE;  // Reference to the module this permission is related to
    action: string; // List of permissions like 'read', 'write', 'update', 'delete'
}

const PermissionSchema: Schema = new Schema({
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'modules', required: true },
    action: { type: String, enum: ['read', 'write', 'update', 'delete'], required: true },
}, { timestamps: true });

// Define and export the model
export const PermissionsModel = mongoose.model<IPERMISSION>('permissions', PermissionSchema);
