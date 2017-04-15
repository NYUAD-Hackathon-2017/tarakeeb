"use strict"

document.addEventListener("DOMContentLoaded", init);

var colors         = null;
var grammar_simple = null;
var words          = null;
var conjugations   = null; // where letters change forms if added in front.

var sentence = [];
var clickbuffer = {};
var LONGCLICKTIME = 400;

function loaddata(callback) {
	d3.queue()
	  .defer(d3.json, "json/examplecolors.json")
	  .defer(d3.json, "json/examplegrammar.json")
	  .defer(d3.json, "json/examplelesson.json")
	  .defer(d3.json, "json/canCombine.json")
	  .awaitAll(function(e, results){
	  	if(e) throw e;
	  	colors         = results[0];
	  	grammar_simple = results[1];
	  	words          = results[2];
	  	conjugations   = results[3];
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

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 * 
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 * 
 * @see http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextWidth (text, font) {
	// re-use canvas object for better performance
	var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
	var context = canvas.getContext("2d");
	context.font = font;
	var metrics = context.measureText(text);
	return metrics.width;
};

var forcesim;
var collisionforce, centerforce, forcex, forcey;
function initwords() {
	// initialize word positions
	for (let i = 0; i < words.length; i++) {
		words[i].x = randbetween(0, 800);
		words[i].y = randbetween(0, 400);
		words[i].rot = randbetween(-30, 30);
		words[i].fontsize = randbetween(70, 100);
		words[i].currentsize = words[i].fontsize;
	}

	forcesim = d3.forceSimulation(words);
	centerforce = d3.forceCenter(400, 300);
	collisionforce = d3.forceCollide(function(d){
		var size = getTextWidth(d.word, d.fontsize + "px sans serif");
		return size;
	});
	forcesim.force("collision", collisionforce)
			.force("x", forcex)
			.force("y", forcey);
	d3.select("#svg_words")
	  .append("g")
	  .classed("words", true)
	  .selectAll("text")
	  .data(words, d3key)
	  .enter()
	  .append("text")
	  .classed("svgword", true)
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
	  .style("font-size", function(d){
	  	return d.currentsize;
	  })
	  .on("mousedown", word_onmousedown)
	  .on("mouseup", word_onmouseup)
	  .on("mouseover", word_onmouseover)
	  .on("mouseout", word_onmouseout);

    d3.select("#svg_sentence")
      .append("g")
      .attr("id", "sentence_group")
      .append("text")
      .attr("id", "sentence_texttag")
      .attr("transform", "translate(180, 50)");
    let svgsentence = d3.select("#svg_sentence");
    svgsentence.append("circle")
      .attr("id", "grammarbutton")
      .attr("r", 40)
      .attr("cx", 40)
      .attr("cy", 50)
      .style("fill", "#f39c12")
      .style("stroke", "#f39c12")
      .on("click", checkgrammar);
    svgsentence.append("text")
      .attr("id", "grammarbutton_text")
      .attr("x", 0)
      .attr("y", 50)
      .style("font-size", 30)
      .style("fill", "black")
      .style("stroke", "black")
      .text("Check!")
      .style("pointer-events", "none");


    svgsentence.append("circle")
      .attr("id", "clearbutton")
      .attr("r", 40)
      .attr("cx", 130)
      .attr("cy", 50)
      .style("fill", "#f39c12")
      .style("stroke", "#f39c12")
      .on("click", function(){
      	  sentence = [];
      	  putsentence(); 
      });
    svgsentence.append("text")
      .attr("id", "clearbutton_text")
      .attr("x", 100)
      .attr("y", 50)
      .style("font-size", 30)
      .style("fill", "black")
      .style("stroke", "black")
      .text("Clear")
      .style("pointer-events", "none");

    forcesim.on("tick", updatewords);
}

function updatewords() {
	// Next, recenter svg on words using viewBox
	let minX = words[0].x; 
	let maxX = words[0].x;
	let minY = words[0].y;
	let maxY = words[0].y;
	for (let i = 0; i < words.length; i++) {
		let r = words[i].fontsize * 1.1;
		let x = words[i].x;
		let y = words[i].y;
		if (x - r < minX) {
			minX = x - r;
		}
		if (x + r > maxX) {
			maxX = x + r;
		}
		if (y - r < minY) {
			minY = y - r;
		}
		if (y - r > maxY) {
			maxY = y - r;
		}
	}
	let width  = maxX - minX;
	let height = maxY - minY;

	d3.select("#svg_words")
	  .attr("viewBox", minX + " " + minY + " " + width + " " + height);

	d3.select(".words")
	  .selectAll("text")
	  .data(words, d3key)
	  .style("font-size", function(d){
	  	return d.currentsize;
	  })
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
			   .classed(d.word.pos, true)
			   .classed("sentence_tspan", true)
			   .text(d.word.word)
			   .style("stroke", colors[d.word.pos].stroke)
			   .style("fill", colors[d.word.pos].fill)
			   .on("click", function(d){
			   	  deleteWordFromSentence(d, i);
			   });

		    // if either of these conditions are right, skip space
		    var condition1 = d.isConjugatedNext;
		    var condition2 = (i+1 < sentence.length) && sentence[i+1].isConjugatedPrev;

			if (condition1 || condition2)
				{}
			else {
			    sel.append("tspan")
			       .classed("sentence_tspan", true)
			       .classed("space", true)
			       .text(" ");				
			}
	   });
}

// instead of drawing on the svg, make a string
function putsentence_s() {
	let out = "";
	for (let i = 0; i < sentence.length; i++) {
		let d = sentence[i];

		out += d.word.pronounce;

	    var condition1 = d.isConjugatedNext;
	    var condition2 = (i+1 < sentence.length) && sentence[i+1].isConjugatedPrev;

	    if (condition1 || condition2)
			{}
		else {
		    out += " ";			
		}
	}
	return out;
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
				// also read it out
				responsiveVoice.speak(d.pronounce,"Arabic Female", {rate: 0.75});
				deletemeaning = window.setTimeout(function(){
					d3.select("#meaning")
					  .text("");
				}, 1600);
			} else {
				pushWordToSentence(d);
				// short click
			}
			delete clickbuffer[key];
		}, 150);
	// }
}

function word_onmouseover(d, i) {
	let sel = d3.select(this);
	sel.transition()
	   .style("font-size", d.fontsize * 1.2);
}

function word_onmouseout(d, i) {
	let sel = d3.select(this);
	sel.transition()
	   .style("font-size", d.fontsize);
}

function isCombinable(pos) {
	if(pos in conjugations)
	 	return conjugations[pos];
 	return false;
}

function pushWordToSentence(d) {
	// "indexes" is the related indexes to delete upon click.
	var sentenceword = {word:d, isConjugatedPrev:false, isConjugatedNext:false};
	sentence.push(sentenceword);
	// next, do a pass over the sentence to combine things that can combine.
	for (let i = 0; i < sentence.length; i++) {
		var result = isCombinable(sentence[i].word.pos);
		if (result == "next") {
			sentence[i].isConjugatedNext = true;
		} else if (result == "prev") {
			sentence[i].isConjugatedPrev = true;
		}
	}
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
		POSarray.push(sentence[i].word.pos);
	}
	request.mimeType("application/json")
	       .post(JSON.stringify(POSarray), function(d){
				clearTimeout(grammartimeout);
				let data = JSON.parse(d.response);
				if (data[0]) {
					d3.select("#result")
					  .text("Correct!");
					// if correct, read it out
					let s = putsentence_s();
					responsiveVoice.speak(s, "Arabic Female", {rate: 0.75});
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