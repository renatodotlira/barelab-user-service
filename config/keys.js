if (process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "staging") {
  console.log("1");
  module.exports = require("./keys-env");
} else {
  console.log("2");
  module.exports = require("./keys-dev");
}