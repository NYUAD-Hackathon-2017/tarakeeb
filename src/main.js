"use strict"

document.addEventListener("DOMContentLoaded", init);

var colors         = null;
var grammar_simple = null;
var wordclass      = null;
var words          = null;

var sentence = [];
var clickbuffer = {};
var LONGCLICKTIME = 400;

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
	  .style("font-size", randbetween(70, 100))
	  .on("mousedown", word_onmousedown)
	  .on("mouseup", word_onmouseup);
    d3.select("svg")
      .append("g")
      .attr("id", "sentence_group")
      .append("text")
      .attr("id", "sentence_texttag")
      .attr("transform", "translate(0, 450)");
}

function putsentence() {
	var sel = d3.select("#sentence_texttag");
	var counter = 0;
	sel.html("");
	sel.selectAll(".word_and_space")
	   .data(sentence)
	   .enter()
	   .each(function(d, i){
	   		let sel = d3.select(this);
	   		sel.append("tspan")
			   .classed(d[1], true)
			   .classed("sentence_tspan", true)
			   .text(d[0])
			   .style("stroke", colors[d[1]].stroke)
			   .style("fill", colors[d[1]].fill)
			   .on("click", function(d){
			   	  deleteWordFromSentence(d, i);
			   });
		    sel.append("tspan")
		       .classed("sentence_tspan", true)
		       .classed("space", true)
		       .text(" ");
	   });
}

function word_onmousedown(d, i) {
	var key = d[0] + d[1];
	if (key in clickbuffer) {
		clickbuffer[key].mousedown++;
	} else {
		clickbuffer[key] = {
		"start": new Date().getTime(),
		"end": null,
		"mousedown": 1,
		"mouseup": 0
		}
	}	
}

var deletemeaning;
var doubleclick;
function word_onmouseup(d, i) {
	var key = d[0] + d[1];
	clickbuffer[key].end = new Date().getTime();
	clickbuffer[key].mouseup++;
	// First, wait for a potential second click
	if (clickbuffer[key].mouseup >= 2) {
		clearTimeout(doubleclick);
		pushWordToSentence(d);
		delete clickbuffer[key];
	} else {
		doubleclick = window.setTimeout(function(){
			// long click
			if (clickbuffer[key].end - clickbuffer[key].start > LONGCLICKTIME) {
				pushWordToSentence(d);
			} else {
				// short click
				clearTimeout(deletemeaning);
				d3.select("#meaning")
				  .text(d[2]);
				deletemeaning = window.setTimeout(function(){
					d3.select("#meaning")
					  .text("");
				}, 800);
			}
			delete clickbuffer[key];
		}, 150);
	}
}

function pushWordToSentence(d) {
	sentence.push(d);
	console.log(d);
	putsentence();
}

function deleteWordFromSentence(d, i) {
	sentence.splice(i, 1);
	putsentence();
}