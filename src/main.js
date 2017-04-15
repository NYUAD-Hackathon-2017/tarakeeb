"use strict"

document.addEventListener("DOMContentLoaded", init);

var colors         = null;
var grammar_simple = null;
var wordclass      = null;
var words          = null;

function loaddata(callback) {
	d3.queue()
	  .defer(d3.json, "json/examplecolors.json")
	  .defer(d3.json, "json/examplegrammar.json")
	  .defer(d3.json, "json/examplewords.json")
	  .defer(d3.json, "json/examplelesson.json")
	  .awaitAll(function(e, results){
	  	if(e) throw e;
	  	colors         = results[0];
	  	grammar_simple = results[1];
	  	wordclass      = results[2];
	  	words          = results[3];
	  	callback();
	  });
}

function init() {
	loaddata(putwords);
}

function randbetween(a, b) {
	return Math.random() * (b - a) + a;
}

function putwords() {
	d3.select("svg")
	  .append("g")
	  .classed("words", true)
	  .selectAll("text")
	  .data(words)
	  .enter()
	  .append("text")
	  .text(function(d){return d[0]})
	  .style("fill", function(d){
	  	  var wordtype = d[1];
	  	  return colors[d[1]].fill;
	  })
	  .style("stroke", function(d){
	  	  var wordtype = d[1];
	  	  return colors[d[1]].stroke;
	  })
	  .attr("transform", function(d){
	  	var translate = "translate(" + randbetween(100, 700) + 
	  		"," + randbetween(100, 300) + ")";
	  	var rotate = "rotate(" + randbetween(-30, 30) + ")";
	  	return translate + " " + rotate;
	  })
	  .style("font-size", randbetween(70, 100));
}