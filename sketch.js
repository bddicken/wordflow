// The depth of the word flow graph
var depthLimit = 4;

// Where the taxt data is read in and stored
var result;

// Set to false after draw is entered for the first time
var firstDraw = true;

// The word to generate graph for
// Eventually, this should be replaced with a user-input value
var graphWord = 'Lord';

// Word input
var input, button, greeting;
// Depth limit input
var inputDepth, buttonDepth, greetingDepth;

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
  result = loadStrings('data.txt');
}

/**
 * Used to process the text file read in
 * TODO: More advanced processing
 */
function process_data(data) {
  var newData = [];
  var l = data.length;
  for (var i = 0; i < l; i++) {
    var splitted = data[i].split(" ");
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
  
  // draw connector
  if (depth != 1) {
    strokeWeight(3);
    stroke(50, 50, 50, 150);
    if (change > 0) {
        line(w, h, prev_x+60, prev_y);
    } else {
        line(w+60, h, prev_x, prev_y);

    }
  }
  
  // draw the node
  stroke(0);
  strokeWeight(1);
  fill(200, 230, 255, 255);
  rect(w, h-10, 60, 20);
  fill(0, 0, 0, 255);
  noStroke();
  text(node.phrase, w+(tw/2.0)+2, h+4);
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

  if (node!= undefined && node.children != undefined && node.children.length > 0) {
    for (var i = 0; i < node.children.length; i++) {
      var size = ((bot_limit - top_limit) / nc);
      var nbl = top_limit + (size * (i+1));
      var ntl = top_limit + (size * i);
      draw_tree_right(depth+1, ntl, nbl, w + change, node.children[i], w, h, change);
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
    }
  }
  if (nn == undefined) {
    nn = new GN(undefined, nw, 1);
    graph.addChild(nn);
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
  var cnv = createCanvas(windowWidth-200, windowHeight);
  cnv.position(200, 0);
  stroke(55);
  frameRate(30);
  
  // Input word button
  textSize(12);
  input = createInput();
  input.position(10, 50);
  button = createButton('update');
  button.position(input.x + input.width, 50);
  button.mousePressed(updateWordSearch);
  greeting = createElement('h3', 'Graph Word:');
  greeting.position(10, 5);
  textAlign(CENTER);
  
  // Depth limit button
  textSize(12);
  inputDepth = createInput();
  inputDepth.position(10, 150);
  buttonDepth = createButton('update');
  buttonDepth.position(input.x + input.width, 150);
  buttonDepth.mousePressed(updateWordSearch);
  greetingDepth = createElement('h3', 'Max Depth');
  greetingDepth.position(10, 105);
  textAlign(CENTER);
}

function buildData() {
  var nd = process_data(result);
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
  background(220, 220, 220);
  if (firstDraw) {
    firstDraw = false;
    buildData();
  }
  draw_tree_right(1, 0, height, width/2, f_root, 20, height/2, 110);
  draw_tree_right(1, 0, height, width/2, b_root, 20, height/2, -110);
} 

function updateWordSearch() {
  graphWord = input.value();
  depthLimit = int(inputDepth.value());
  buildData();
}

/**
 * Whenever the browser window is resized, the canvas is resized to fit
 */
function windowResized() {
  resizeCanvas(windowWidth-200, windowHeight);
}
