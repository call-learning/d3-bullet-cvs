var tape = require("tape");
var d3 = require("../build/d3-bullet-cvs");

require("./pathEqual");

tape("d3.bulletcvs() has the expected defaults", function (test) {
  var b = d3.bulletcvs();
  test.end();
});
