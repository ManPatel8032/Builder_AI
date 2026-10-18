import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new Schema({
    name:{type: String, required: true},
    email:{type: String, required:true, unique:true, lowercase:true, trim:true},
    password: { type: String, required: true},
},{timestamps: true});

// NOTE: No pre('save') bcrypt hook here.
// The frontend sends a SHA-256 hash of the password (never the plaintext).
// The register controller bcrypts that hash before storing it.
// This prevents double-hashing while keeping bcrypt protection in the DB.

// Compare the incoming SHA-256 hash against the bcrypt-stored value
UserSchema.methods.comparePassword = async function (password){
    return bcrypt.compare(password, this.password);
}

export const User = mongoose.model('User', UserSchema); 
