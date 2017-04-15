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
	  .defer(d3.json, "json/examplelesson.json")
	  .awaitAll(function(e, results){
	  	if(e) throw e;
	  	colors         = results[0];
	  	grammar_simple = results[1];
	  	words          = results[2];
	  	callback();
	  });
}

function init() {
	loaddata(initwords);
}

function randbetween(a, b) {
	return Math.random() * (b - a) + a;
}

// initializes svg
var d3key = function(d) {
	return d.key + d.pos;
}

var forcesim;
var collisionforce, centerforce;
function initwords() {
	// initialize word positions
	for (let i = 0; i < words.length; i++) {
		words[i].x = randbetween(100, 700);
		words[i].y = randbetween(100, 300);
		words[i].rot = randbetween(-30, 30);
	}

	forcesim = d3.forceSimulation(words);
	collisionforce = d3.forceCollide(function(d){
		return 50;
	});
	centerforce = d3.forceCenter(400, 300);
	forcesim.force("collision", collisionforce)
			.force("center", centerforce)
	        .alphaDecay(0.01);
	d3.select("svg")
	  .append("g")
	  .classed("words", true)
	  .selectAll("text")
	  .data(words, d3key)
	  .enter()
	  .append("text")
	  .text(function(d){return d.word})
	  .style("fill", function(d){
	  	  return colors[d.pos].fill;
	  })
	  .style("stroke", function(d){
	  	  return colors[d.pos].stroke;
	  })
	  .attr("transform", function(d){
	  	var translate = "translate(" + d.x + 
	  		"," + d.y + ")";
	  	var rotate = "rotate(" + d.rot + ")";
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
      .attr("transform", "translate(100, 570)");
    d3.select("svg")
      .append("circle")
      .attr("id", "grammarbutton")
      .attr("r", 40)
      .attr("cx", 40)
      .attr("cy", 600-40)
      .style("fill", "blue")
      .style("stroke", "black")
      .on("click", checkgrammar);

    forcesim.on("tick", updatewords);
}

function updatewords() {
	d3.select(".words")
	  .selectAll("text")
	  .data(words, d3key)
	  .attr("transform", function(d){
	  	var translate = "translate(" + d.x + 
	  		"," + d.y + ")";
	  	var rotate = "rotate(" + d.rot + ")";
	  	return translate + " " + rotate;
	  });
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
			   .classed(d.pos, true)
			   .classed("sentence_tspan", true)
			   .text(d.word)
			   .style("stroke", colors[d.pos].stroke)
			   .style("fill", colors[d.pos].fill)
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
	var key = d.word + d.pos;
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
	var key = d.word + d.pos;
	clickbuffer[key].end = new Date().getTime();
	clickbuffer[key].mouseup++;
	// First, wait for a potential second click
	// if (clickbuffer[key].mouseup >= 2) {
	// 	clearTimeout(doubleclick);
	// 	pushWordToSentence(d);
	// 	delete clickbuffer[key];
	// } else {
		doubleclick = window.setTimeout(function(){
			// long click
			if (clickbuffer[key].end - clickbuffer[key].start > LONGCLICKTIME) {
				clearTimeout(deletemeaning);
				d3.select("#meaning")
				  .text(d.hint);
				deletemeaning = window.setTimeout(function(){
					d3.select("#meaning")
					  .text("");
				}, 800);
			} else {
				pushWordToSentence(d);
				// short click
			}
			delete clickbuffer[key];
		}, 150);
	// }
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

var grammartimeout;
function checkgrammar() {
	let request = d3.request("check");
	let POSarray = [];
	for (let i = 0; i < sentence.length; i++) {
		POSarray.push(sentence[i].pos);
	}
	request.mimeType("application/json")
	       .post(JSON.stringify(POSarray), function(d){
				clearTimeout(grammartimeout);
				let data = JSON.parse(d.response);
				if (data[0]) {
					d3.select("#result")
					  .text("Correct!");
				} else {
					d3.select("#result")
					  .text("Incorrect");
				}

				grammartimeout = window.setTimeout(function(){
					d3.select("#result")
					  .text("");
				}, 3000);
	});
}