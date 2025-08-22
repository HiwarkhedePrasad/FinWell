require("dotenv").config();

const config = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/spendwise",
  JWT_SECRET:
    process.env.JWT_SECRET || "fallback_jwt_secret_change_in_production",
  PORT: process.env.PORT || 8000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️  WARNING: JWT_SECRET not set. Using fallback secret. This is not secure for production!"
  );
}

if (!process.env.MONGO_URI) {
  console.warn(
    "⚠️  WARNING: MONGO_URI not set. Using default localhost connection."
  );
}

module.exports = config;
