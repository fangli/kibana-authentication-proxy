// remove comment from javascript source
function removeComment(source) {
  return source.replace(/\/\*(.|\n)*?\*\//g, "").replace(/^\s*\/\/.*$/m, "");
}

var fs = require("fs");
var config_source = fs.readFileSync(__dirname + "/../kibana/src/config.js", "utf-8");

// wrap with anonymous function and override 'define', 'window' in it
var config = new Function(
  "function define(a, b) { return b(Object); };" +
  "var window = {location: {hostname: 'hostname'}};" +
  "return " + removeComment(config_source).trim()
)();

module.exports = config;
