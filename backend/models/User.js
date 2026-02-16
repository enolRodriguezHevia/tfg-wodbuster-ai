const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  sex: {
    type: String,
    enum: ['masculino', 'femenino', 'N/D'],
    default: 'N/D'
  },
  age: {
    type: Number,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  height: {
    type: Number,
    min: 0
  },
  profilePhoto: {
    type: String,
    default: null
  },
  llmPreference: {
    type: String,
    enum: ['claude', 'openai'],
    default: 'claude',
    description: 'Modelo de IA preferido para análisis (claude o openai)'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
