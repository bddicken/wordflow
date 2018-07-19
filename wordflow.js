/**
 * @author Benjamin Dicken (bddicken)
 * @description The primary source file for drawing the wordflow graph and UI.
 */

// use for translating and scaling with the mouse
var panZoomCont;

var zoomMouseX = 0;
var zoomMouseY = 0;

// True if the mouse has been clicked, and thus the selected node on the
// graph should be (potentially) updated).
var shouldUpdateSelectedNode = false;

// The depth of the word flow graph
var depthLimit = 4;

// The width of the sidebar
var sidebarWidth = 250;

// Where the text data is read in and stored
//var result;
var bible;
var biblePureText = undefined;
var chapter = 'Psalm'

// Set to false after draw is entered for the first time
var firstDraw = true;

// The words to use at the root for the graph
// Eventually, this should be replaced with a user-input value
var graphRootWords = ['Jehovah', 'is'];

// The default value for path frequency occurrence threshold
var pathFreq = 2;

// Word input
var input, button, greeting;
// Depth limit input
var inputDepth, buttonDepth, greetingDepth;
// Path frequency limit input
var inputFreq, buttonFreq, greetingFreq;
// Chapter select
var selectCh, greetingCh;
// Verses listing label
var greetingVerses;

// The verses associated with the currently-selected graph node
var versesForSelected = [];

// Custom pmouseX and pmouseY
// See mouseDragged function for more details
var pmouseXCustom = -1;
var pmouseYCustom = -1;

/**
 * GN is the "Graph-Node" class
 * Used for the internal model of the visual word-graph
 */
class GN {
  constructor(parentGN, phrase, count) {
    this.phrase = phrase;
    this.count = count;
    this.parentGN = parentGN;
    this.children = [];
    this.pureTextIndexes = [];
    this.originalText = undefined;
    this.originIndex = undefined;
    this.verses = [];
  }

  addVerse(verse) {
    this.verses.push(verse);
  }

  addPureTextIndex(index) {
    this.pureTextIndexes.push(index);
  }

  hasOriginalTextInfo() {
    return this.originalText != undefined && this.originIndex != undefined;
  }

  /**
   * Store the original text that graph was extracted from.
   * Typically only needed for root node, which is why this is a separate function.
   */
  addOriginalTextInfo(originalText, originIndex) {
    this.originalText = originalText;
    this.originIndex = originIndex;
  }

  addChild(child) {
    this.children.push(child);
  }

  /**
   * Check if this node has a pth through the children with the stringPath text.
   */
  checkIfHasPath(stringPath) {
    var splitted = stringPath.split(" ");
    //print("splitteddd = " + splitted);
    return this.checkIfHasPathRecursiveHelper(splitted, 0, this);
  }

  checkIfHasPathRecursiveHelper(stringPath, spIndex, node) {
    if (spIndex == ((stringPath.length))) {
      //print("TRUE!");
      return true;
    }
    var foundPath = false;
    if (node.phrase == stringPath[spIndex]) {
      for (var i = 0 ; i < node.children.length ; i++) {
        foundPath = foundPath || this.checkIfHasPathRecursiveHelper(stringPath, spIndex+1, node.children[i]);
      }
    }
    return foundPath;
  }

  /**
   * TODO: check for duplicates
   * TODO: Update count automatically
   */
  showChildren() {
    for (var i = 0 ; i < this.children.length ; i++) {
      print(this.children[i].phrase)
    }
  }

  print(level, item) {
    print('  '.repeat(level) + item.phrase);
    for (var i = 0 ; i < item.children.length ; i++) {
      item.print(level+1, item.children[i]);
    }
  }
}

/**
 * This function run before setup and draw
 * Reads in text data to be processed and analyzed
 */
function preload() {
  bible = loadJSON('./data/bible.json');
}

/**
 * Used to process the text file read in
 * TODO: More advanced processing
 */
function processData(data, chapter) {
  var newData = [];
  var chapVersText = data[chapter];
  var l = chapVersText.length;
  for (var i = 0; i < l; i++) {
    var splitted = chapVersText[i][1].split(" ");
    for (var j = 0; j < splitted.length; j++) {
      newData.push([chapVersText[i][0], splitted[j]]);
    }
  }
  print(newData);
  return newData;
}
  
function getNodeH(tl, bl) {
  return tl + ((bl - tl)/2.0);
}
    
function nodeIsOnHighlightPath(node) {
  // check path highlight NEW
  for (var i = 0; i < node.verses.length; i++) {
    if (versesForSelected.indexOf(node.verses[i]) > -1) {
      return true;
    }
  }
  return false;
}

/**
 * Recursive function to draw the tree
 */
function drawWordTree(depth, top_limit, bot_limit, nodeX, node, prevX, prevY, change, oppositeRoot, prevRectW) {

  if (node == undefined) { return false; }
  var isOnHPath = nodeIsOnHighlightPath(node);
  if (node.count < pathFreq && !isOnHPath) { return false; }

  var pan = panZoomCont.getPan();
  // sc, short for "scale"
  var sc = panZoomCont.getScale();
  // mouseX and mouseX adjusted for scale and translation
  var mXA = (mouseX/sc) - pan.x/sc;
  var mYA = (mouseY/sc) - pan.y/sc;
  // h, short for "height"
  var h = getNodeH(top_limit, bot_limit);
  var nodeRectHeight = (20/sc);
  var halfRectHeight = (nodeRectHeight)/2;
  var scaledTextSize = 13/sc;
  textSize(scaledTextSize);
  var textW = textWidth(node.phrase);
  var rectW = textW + 25;
  
  fill(0, 0, 0, 255);

  // draw the node
  stroke(0);
  noStroke();
  fill(150, 250, 255, 255);
  // color differently if on highlight path
  if (isOnHPath) {
    fill(5, 130, 210);
  } else {
    fill(5, 100, 170);
  }
  rect(nodeX, h-halfRectHeight, rectW, nodeRectHeight, 5);
  fill(0, 0, 0, 255);
  noStroke();
  fill(255, 255, 240);
  text(node.phrase, nodeX+(textW/2.0)+2, h+scaledTextSize-halfRectHeight);
  if (node.count > 1) {
    var nodeTextWidth = textWidth('' + node.count) - 2;
    fill(248, 144, 37);
    ellipse(nodeX + (rectW - 2) - (nodeTextWidth/2), h, nodeTextWidth + 5, nodeRectHeight);
    fill(0);
    text(node.count, nodeX + (rectW - 2) - (nodeTextWidth/2), h+scaledTextSize-halfRectHeight);
  }
  //print("  ".repeat(depth) + "dwh = " + depth + "   " + w + " " + h);
  //print("  ".repeat(depth) + "tb = " + top_limit + " " + bot_limit);
  noStroke();

  var highlightPath = false;
  // handle button press
  if (shouldUpdateSelectedNode) {
    if (mXA > nodeX && mXA < nodeX+rectW && mYA > h-10 && mYA < h+nodeRectHeight) {
      shouldUpdateSelectedNode = false;
      fill(0, 255, 255, 75);
      rect(nodeX, h-halfRectHeight, rectW, nodeRectHeight, 5);
      //rect(w, h-10, rectW, 20, 5);
      highlightPath = true;
      versesForSelected = node.verses;
      var infobar = document.getElementById('infobar');
      infobar.innerHTML = '';
      for (var i = 0; i < node.verses.length; i++) {
        var ci = infobar.innerHTML;
        var blbBase = 'https://www.blueletterbible.org/asv/';
        var bcv = node.verses[i];
        var sp = bcv.split('_')
        var book = sp[0]
        var chap = sp[1].split(':')[0]
        var vers = sp[1].split(':')[1]
        var url = blbBase + book + '/' + chap + '/' + vers;
        var link = '<a target="_blank" href = "' + url + '">' + bcv + '</a>';
        infobar.innerHTML = ci + link + '<br/>';
      }
    }
  } 

  var nc = node.children.length;

  if (node!= undefined && node.children != undefined && nc > 0) {

    // Figure out which children need to be traversed, based on the frequency threshold
    var childrenToTraverse = []
    for (var i = 0; i < nc; i++) {
      if (node.children[i] != undefined && node.children[i].count >= pathFreq) { 
        childrenToTraverse.push(node.children[i]);
      }
    }

    // Traverse the correct children
    var ntc = childrenToTraverse.length;
    for (var i = 0; i < ntc; i++) {
      var size = ((bot_limit - top_limit) / ntc);
      var nbl = top_limit + (size * (i+1));
      var ntl = top_limit + (size * i);
      highlightPath = drawWordTree(depth+1, ntl, nbl, nodeX + ((rectW + 50) * change), childrenToTraverse[i], nodeX, h, change, oppositeRoot, rectW) || highlightPath;
    }
  }
  
  // draw connector
  fill(0, 0, 0, 0);
  if (depth != 0) {
    strokeWeight(2/sc);

    if (isOnHPath || highlightPath) {
      stroke(130, 255, 130, 200);
    } else {
      stroke(130, 130, 130, 150);
    }

    // draw a bezier curve, but modify depending on forwards or backwards display
    if (change > 0) {
        bezier(nodeX, h, nodeX-40, h, prevX+prevRectW+40, prevY, prevX+prevRectW, prevY);
    } else {
        bezier(nodeX+rectW, h, nodeX+rectW+40, h, prevX-40, prevY, prevX, prevY);
    }
  }
    
  return highlightPath;
}

var f_root = undefined;
var b_root = undefined;

function buildGraphForWordRecursive(words, data, index, depth, graph, increment) {
  
  // recursive base-cases
  if (data.length <= index+increment) { return; }
  if (depth >= depthLimit)            { return; }
  if (0 > index+increment)            { return; }

  // find existing or create new node and add to graph
  var verse = data[index+increment][0];
  var nw = data[index+increment][1];
  var nn = undefined;
  for (var i = 0; i < graph.children.length; i++) {
    if (graph.children[i].phrase == nw) {
      nn = graph.children[i];
      graph.count = graph.count + 1;
    }
  }
  if (nn == undefined) {
    nn = new GN(undefined, nw, 1);
    graph.addChild(nn);
    if (graph.children.length > 1) {
      graph.count = graph.count + 1;
    }
  }
  nn.addVerse(verse);
  nn.addPureTextIndex(index+increment);
  
  // recurse
  buildGraphForWordRecursive(nn.phrase, data, index+increment, depth + 1, nn, increment);
}

function isWordSequenceAtDataLocation(wordSequence, data, dataIndex) {
  for (var i = 0; i < wordSequence.length ; i++) {
    if (wordSequence[i] != data[dataIndex + i][1]) {
        return false;
    }
  }
  return true;
}

/**
 * graph is an out-param
 */
function buildGraphForWord(words, data, increment) {
  var matching_indexes = [];
  for (var i = 0 ; i < data.length ; i++) {
    if (data[i][1] == words[0]) {
      if ( isWordSequenceAtDataLocation(words, data, i) ) {
        matching_indexes.push(i);
      }
    }
  }

  var indexOffset = 0;
  if (increment == 1) {
    indexOffset =  words.length-1;
  }

  var root = new GN(undefined, words.join(' '), 3);
  for (var i = 0 ; i < matching_indexes.length ; i++) {
    buildGraphForWordRecursive(words, data, matching_indexes[i] + indexOffset, 0, root, increment);
    root.addPureTextIndex(matching_indexes[i]);
    var verse = data[matching_indexes[i]][0];
    root.addVerse(verse);
  }
  return root;
}

/**
 * Basic setup
 */
function setup() {
  // setup for pan/zoom controller
  panZoomCont = new PanZoomController();

  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0);
  cnv.parent('canvasholder');
  stroke(55);
  frameRate(30);
  
  // Input word button
  textSize(12);
  input = createInput(graphRootWords.join(' '));
  input.position(10, 100);
  input.parent('sidebar');
  button = createButton('update');
  button.position(input.x + input.width, 100);
  button.mousePressed(updateWordSearch);
  button.parent('sidebar');
  greeting = createElement('h3', 'Graph Word');
  greeting.position(10, 55);
  greeting.parent('sidebar');
  
  // Depth limit button
  textSize(12);
  inputDepth = createInput(depthLimit);
  inputDepth.position(10, 174);
  inputDepth.parent('sidebar');
  buttonDepth = createButton('update');
  buttonDepth.position(input.x + input.width, 175);
  buttonDepth.mousePressed(updateWordSearch);
  buttonDepth.parent('sidebar');
  greetingDepth = createElement('h3', 'Max Depth');
  greetingDepth.position(10, 125);
  greetingDepth.parent('sidebar');

  background(200);
  selectCh = createSelect();
  selectCh.position(10, 250);
  for (var key in bible) {
    var el = createElement('option', key);
    // set the default selected chapter
    if (key == chapter) {
      el.attribute('selected', 'selected');
    }
    selectCh.child(el);
  }
  selectCh.changed(updateWordSearch);
  greetingCh = createElement('h3', 'Chapter');
  greetingCh.position(10, 205);
  greetingCh.parent('sidebar');
  
  // Path frequency limit button
  textSize(12);
  inputFreq = createInput(pathFreq);
  inputFreq.position(10, 315);
  inputFreq.parent('sidebar');
  buttonFreq = createButton('update');
  buttonFreq.position(input.x + input.width, 315);
  buttonFreq.mousePressed(updateWordSearch);
  buttonFreq.parent('sidebar');
  greetingFreq = createElement('h3', 'Min path freqency');
  greetingFreq.position(10, 265);
  greetingFreq.parent('sidebar');
  
  greetingVerses = createElement('h3', 'Verses');
  greetingVerses.position(10, 350);
  greetingVerses.parent('sidebar');
 
  textAlign(CENTER);
}

function buildData() {
  biblePureText = processData(bible, chapter);
  f_root = buildGraphForWord(graphRootWords, biblePureText, 1);
  b_root = buildGraphForWord(graphRootWords, biblePureText, -1);
}

/**
 * The primary animation loop
 */
function draw() {
  // setup for pan/zoom controller
  var pan = panZoomCont.getPan();
  var sc = panZoomCont.getScale();

  push();

  translate(pan.x, pan.y);
  scale(sc);
  
  background(255);
  if (firstDraw) {
    firstDraw = false;
    buildData();
  }
  drawWordTree(0, 0, height+7, width/2-30+100, f_root, 20, height/2, 1, b_root, 0);
  drawWordTree(0, 0, height+7, width/2-30+100, b_root, 20, height/2, -1, f_root, 0);
 
  pop();
} 

function updateWordSearch() {
  pathFreq = int(inputFreq.value());
  chapter = selectCh.value();
  graphRootWords = input.value().split(' ');
  depthLimit = int(inputDepth.value());
  buildData();
}

/**
 * Whenever the browser window is resized, the canvas is resized to fit
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * Event is triggered whenever the mouse pointer is click-dragged.
 * Use for translating the canvas so that the graph can be moved around..
 */
function mouseDragged() {
  panZoomCont.mouseDragged(mouseX, mouseY, pmouseX, pmouseY);
}

function mouseReleased() {
  pmouseXCustom = -1;
  pmouseYCustom = -1;
  shouldUpdateSelectedNode = false;
}

/**
 * Event is triggered whenever the mouse wheel is scrolled.
 * This is used for scaling the graph ("zoom" in/out).
 * event.delta is the positive/negative distance of the scale.
 */
function mouseWheel(event) {
  if (mouseX > sidebarWidth) {
    panZoomCont.mouseWheel(event.delta);
  }
}

/**
 * This function is implemented to help with node selection.
 */
function mousePressed() {
  shouldUpdateSelectedNode = true;
  return false;
}

