// use for translating ond scaling with the mouse
var translateX = 0;
var translateY = 0;
var scaleFactor = 1.0;

// The depth of the word flow graph
var depthLimit = 4;

// Where the taxt data is read in and stored
//var result;
var bible;
var chapter = '1 Chronicles'

// Set to false after draw is entered for the first time
var firstDraw = true;

// The word to generate graph for
// Eventually, this should be replaced with a user-input value
var graphWord = 'kingdom';

// Word input
var input, button, greeting;
// Depth limit input
var inputDepth, buttonDepth, greetingDepth;
// Chapter select
var selectCh, greetingCh;

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
  }

  addChild(child) {
    this.children.push(child);
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
  //result = loadStrings('./data/asv.txt');
  bible = loadJSON('./data/bible.json');
}

/**
 * Used to process the text file read in
 * TODO: More advanced processing
 */
function process_data(data, chapter) {
  var newData = [];
  var chapVersText = data[chapter];
  var l = chapVersText.length;
  for (var i = 0; i < l; i++) {
    var splitted = chapVersText[i][1].split(" ");
    for (var j = 0; j < splitted.length; j++) {
      newData.push(splitted[j]);
    }
  }
  print(newData);
  return newData;
}
  
function get_node_h(tl, bl) {
  return tl + ((bl - tl)/2.0);
}

/**
 * Recursive function to draw the tree
 */
function draw_tree_right(depth, top_limit, bot_limit, w, node, prev_x, prev_y, change) {

  if (node == undefined) { return; }

  var h = get_node_h(top_limit, bot_limit);
  var tw = textWidth(node.phrase);
  var sf = scaleFactor;
  var wsf = w*sf;
  var hsf = h*sf;
  
  // draw connector
  fill(0, 0, 0, 0);
  if (depth != 1) {
    strokeWeight(3);
    stroke(130, 130, 130, 150);
    // draw a bezier curve, but modify depending on forwards or backwards display
    if (change > 0) {
        bezier(wsf, hsf, wsf-40, hsf, prev_x+70+40, prev_y, prev_x+70, prev_y);
    } else {
        bezier(wsf+70, hsf, wsf+70+40, hsf, prev_x-40, prev_y, prev_x, prev_y);
    }
  }
  fill(0, 0, 0, 255);
  
  // draw the node
  stroke(0);
  //strokeWeight(1);
  noStroke();
  fill(150, 200, 255, 255);
  fill(5, 100, 170);
  rect(wsf, hsf-10, 70, 20, 5);
  fill(0, 0, 0, 255);
  noStroke();
  //stroke(255);
  fill(255, 255, 240);
  text(node.phrase, wsf+(tw/2.0)+2, hsf+4);
  if (node.count > 1) {
    fill(248, 144, 37);
    ellipse(wsf+60, hsf, 15, 15);
    fill(0);
    text(node.count, wsf+60, hsf+4);
  }
  //print("  ".repeat(depth) + "dwh = " + depth + "   " + w + " " + h);
  //print("  ".repeat(depth) + "tb = " + top_limit + " " + bot_limit);
  noStroke();

  // handle button press
  //if (mousePressed) {
  //  if (mouseX > w && mouseX < w+20 && mouseY > h-10 && mouseY < h+10) {
  //    graphWord = node.phrase;
  //  }
  //} 

  var nc = node.children.length;

  if (node!= undefined && node.children != undefined && nc > 0) {
    for (var i = 0; i < nc; i++) {
      var size = ((bot_limit - top_limit) / nc);
      var nbl = top_limit + (size * (i+1));
      var ntl = top_limit + (size * i);
      draw_tree_right(depth+1, ntl, nbl, w + change, node.children[i], wsf, hsf, change);
    }
  }
}
  
var f_root = undefined;
var b_root = undefined;

function build_graph_for_recursive(word, data, index, depth, graph, increment) {
  
  // recursive base-cases
  if (depth >= depthLimit) { return; }
  if (data.length <= index+increment) { return; }
  if (0 > index+increment) { return; }

  // find existing or create new node and add to graph
  var nw = data[index+increment];
  var nn = undefined;
  for (var i = 0; i < graph.children.length; i++) {
    if (graph.children[i].phrase == nw) {
      nn = graph.children[i];
      //nn.count = nn.count + 1;
      graph.count = graph.count + 1;
    }
  }
  if (nn == undefined) {
    nn = new GN(undefined, nw, 0);
    graph.addChild(nn);
    graph.count = graph.count + 1;
  }

  // recurse
  build_graph_for_recursive(nn.phrase, data, index+increment, depth + 1, nn, increment);
}

/**
 * graph is an out-param
 */
function build_graph_for_word(word, data, increment) {
  var matching_indexes = [];
  for (var i = 0 ; i < data.length ; i++) {
    if (data[i] == word) { matching_indexes.push(i); }
  }
  var root = new GN(undefined, word, 3);
  for (var i = 0 ; i < matching_indexes.length ; i++) {
    build_graph_for_recursive(word, data, matching_indexes[i], 0, root, increment);
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
  inputDepth.position(10, 150);
  inputDepth.parent('sidebar');
  buttonDepth = createButton('update');
  buttonDepth.position(input.x + input.width, 150);
  buttonDepth.mousePressed(updateWordSearch);
  buttonDepth.parent('sidebar');
  greetingDepth = createElement('h3', 'Max Depth');
  greetingDepth.position(10, 105);
  greetingDepth.parent('sidebar');

  background(200);
  selectCh = createSelect();
  selectCh.position(10, 200);
  for (var key in bible) {
    selectCh.option(key);
  }
  selectCh.changed(updateWordSearch);
  greetingCh = createElement('h3', 'Chapter');
  greetingCh.position(10, 155);
  greetingCh.parent('sidebar');
  textAlign(CENTER);
}

function buildData() {
  var nd = process_data(bible, chapter);
  f_root = build_graph_for_word(graphWord, nd, 1);
  b_root = build_graph_for_word(graphWord, nd, -1);
  //f_root.print(1, f_root);
  //print("-----\n");
  //b_root.print(1, b_root);
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
  draw_tree_right(1, 0, height+7, width/2-30+100, f_root, 20, height/2, 120);
  draw_tree_right(1, 0, height+7, width/2-30+100, b_root, 20, height/2, -120);
} 

function updateWordSearch() {
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
 * Event is triggered whenever the mouse pointer is pressed.
 * Use to help with translating the canvas so that the graph can be moved around..
 */
function mousePressed() {
  print('mouse is pressed');
}

/**
 * Event is triggered whenever the mouse pointer is click-dragged.
 * Use for translating the canvas so that the graph can be moved around..
 */
function mouseDragged() {
  translateX += mouseX - pmouseX;
  translateY += mouseY - pmouseY;
  print('mouse is dragged');
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

