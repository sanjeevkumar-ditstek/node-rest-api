import mongoose, { Schema, Document } from 'mongoose';

export default interface IMODULE extends Document {
  name: string;  // e.g., 'product', 'order', etc.
}

const ModuleSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
});

export const ModulesModel = mongoose.model<IMODULE>('modules', ModuleSchema);
