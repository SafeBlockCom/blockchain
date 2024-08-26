require("dotenv").config(); // Ensure that dotenv is used to load env variables

module.exports = {
  development: {
    username: process.env.DB_USERNAME || "your_default_username",
    password: process.env.DB_PASSWORD || "your_default_password",
    database: process.env.DB_DATABASE || "your_default_database",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
  },
  test: {
    username: process.env.DB_USERNAME || "your_default_username",
    password: process.env.DB_PASSWORD || "your_default_password",
    database: process.env.DB_DATABASE || "your_default_database",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: process.env.DB_USERNAME || "your_default_username",
    password: process.env.DB_PASSWORD || "your_default_password",
    database: process.env.DB_DATABASE || "your_default_database",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
  },
};
