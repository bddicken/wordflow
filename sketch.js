// use for translating ond scaling with the mouse
var translateX = 0;
var translateY = 0;
var scaleFactor = 1.0;

// The depth of the word flow graph
var depthLimit = 4;

// Where the taxt data is read in and stored
//var result;
var bible;
var biblePureText = undefined;
var chapter = 'Matthew'

// Set to false after draw is entered for the first time
var firstDraw = true;

// The word to generate graph for
// Eventually, this should be replaced with a user-input value
var graphWord = 'Jesus';

// The default value for path frequency occurence threshold
var pathFreq = 3;

// Word input
var input, button, greeting;
// Depth limit input
var inputDepth, buttonDepth, greetingDepth;
// Path frequency limit input
var inputFreq, buttonFreq, greetingFreq;
// Chapter select
var selectCh, greetingCh;

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

/**
 * Recursive function to draw the tree
 */
function drawWordTree(depth, top_limit, bot_limit, w, node, prev_x, prev_y, change, oppositeRoot) {

  if (node == undefined) { return false; }
  if (node.count < pathFreq) { return false; }

  // mouseX and mouseX adjusted for scale and translation
  var mXA = (mouseX - translateX) * (1/scaleFactor);
  var mYA = (mouseY - translateY) * (1/scaleFactor);

  var h = getNodeH(top_limit, bot_limit);
  var tw = textWidth(node.phrase);
  var sf = scaleFactor;
  var wsf = w*sf;
  var hsf = h*sf;
  
  fill(0, 0, 0, 255);

  // draw the node
  stroke(0);
  noStroke();
  fill(150, 250, 255, 255);
  fill(5, 100, 170);
  rect(wsf, hsf-10, 70, 20, 5);
  fill(0, 0, 0, 255);
  noStroke();
  fill(255, 255, 240);
  text(node.phrase, wsf+(tw/2.0)+2, hsf+4);
  if (node.count > 1) {
    var nodeTextWidth = textWidth('' + node.count);
    fill(248, 144, 37);
    ellipse(wsf + 68 - (nodeTextWidth/2), hsf, nodeTextWidth + 5, 15);
    fill(0);
    text(node.count, wsf + 68 - (nodeTextWidth/2), hsf+4);
  }
  //print("  ".repeat(depth) + "dwh = " + depth + "   " + w + " " + h);
  //print("  ".repeat(depth) + "tb = " + top_limit + " " + bot_limit);
  noStroke();

  var highlightPath = false;
  // handle button press
  if (mouseIsPressed) {
    if (mXA > wsf && mXA < wsf+70 && mYA > hsf-10 && mYA < hsf+10) {
      fill(0, 255, 255, 75);
      rect(wsf, hsf-10, 70, 20, 5);
      highlightPath = true;
      versesForSelected = node.verses;
    }
  } 

  var nc = node.children.length;

  if (node!= undefined && node.children != undefined && nc > 0) {

    // Figure out how many children need to be traversed, based on the frequency threshold
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
      highlightPath = drawWordTree(depth+1, ntl, nbl, w + change, childrenToTraverse[i], wsf, hsf, change, oppositeRoot) || highlightPath;
    }
  }
  
  // draw connector
  fill(0, 0, 0, 0);
  if (depth != 0) {
    strokeWeight(3);

    // check path highlight NEW
    //var hl = nodeIntersectsClicked(node, depth);
    var hl = false;
    for (var i = 0; i < node.verses.length; i++) {
      if (versesForSelected.indexOf(node.verses[i]) > -1) {
        hl = true;
      }
    }
    if (hl || highlightPath) {
      stroke(130, 255, 130, 200);
    } else {
      stroke(130, 130, 130, 150);
    }

    // draw a bezier curve, but modify depending on forwards or backwards display
    if (change > 0) {
        bezier(wsf, hsf, wsf-40, hsf, prev_x+70+40, prev_y, prev_x+70, prev_y);
    } else {
        bezier(wsf+70, hsf, wsf+70+40, hsf, prev_x-40, prev_y, prev_x, prev_y);
    }
  }
    
  return highlightPath;
}

var f_root = undefined;
var b_root = undefined;

function buildGraphForWordRecursive(word, data, index, depth, graph, increment) {
  
  // recursive base-cases
  if (depth >= depthLimit) { return; }
  if (data.length <= index+increment) { return; }
  if (0 > index+increment) { return; }

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

/**
 * graph is an out-param
 */
function buildGraphForWord(word, data, increment) {
  var matching_indexes = [];
  for (var i = 0 ; i < data.length ; i++) {
    if (data[i][1] == word) { matching_indexes.push(i); }
  }
  var root = new GN(undefined, word, 3);
  for (var i = 0 ; i < matching_indexes.length ; i++) {
    buildGraphForWordRecursive(word, data, matching_indexes[i], 0, root, increment);
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
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0);
  cnv.parent('canvasholder');
  stroke(55);
  frameRate(30);
  
  // Input word button
  textSize(12);
  input = createInput(graphWord);
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
  greetingFreq = createElement('h3', 'Max path freqency');
  greetingFreq.position(10, 265);
  greetingFreq.parent('sidebar');
 
  textAlign(CENTER);
}

function buildData() {
  biblePureText = processData(bible, chapter);
  f_root = buildGraphForWord(graphWord, biblePureText, 1);
  b_root = buildGraphForWord(graphWord, biblePureText, -1);
}

/**
 * The primary animation loop
 */
function draw() {
  translate(translateX, translateY);
  scale(scaleFactor); 
  background(255);
  if (firstDraw) {
    firstDraw = false;
    buildData();
  }
  drawWordTree(0, 0, height+7, width/2-30+100, f_root, 20, height/2, 120, b_root);
  drawWordTree(0, 0, height+7, width/2-30+100, b_root, 20, height/2, -120, f_root);
} 

function updateWordSearch() {
  pathFreq = int(inputFreq.value());
  chapter = selectCh.value();
  graphWord = input.value();
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
  if (pmouseXCustom == -1 && pmouseYCustom == -1) { pmouseXCustom = pmouseX ; pmouseYCustom = pmouseY; }
  if (mouseX < 250) { return; } // Don't move graph when dragging on menu bar
  // For some reason, using the built-in pmouseX and pmouseY to handle dragging of the canvas
  // Does not work properly. Dragging ends up occurring too fast.
  // Had to implement my own pmouseX/pmouseY instead.
  // Maybe this is purposeful, or maybe it's a bug in p5.js that will be addressed in the future.
  translateX += mouseX - pmouseXCustom;
  translateY += mouseY - pmouseYCustom;
  pmouseXCustom = mouseX;
  pmouseYCustom = mouseY;
}

function mouseReleased() {
  pmouseXCustom = -1;
  pmouseYCustom = -1;
}

/**
 * Event is triggered whenever the mouse wheel is scrolled.
 * This is used for scaling the graph ("zoom" in/out).
 * event.delta is the positive/negative distance of the scale.
 */
function mouseWheel(event) {
  translateX -= mouseX;
  translateY -= mouseY;
  var delta = event.delta > 0 ? 1.02 : event.delta < 0 ? 1.0/1.02 : 1.0;
  scaleFactor *= delta;
  translateX *= delta;
  translateY *= delta;
  translateX += mouseX;
  translateY += mouseY;
  return false;
}

