
// The left/right depths of the word flow graph
var depthL = 1;
var depthR = 6;

// The width and height of separation between graph/tree nodes
var tW = 30;
var tH = 20;

// Where the taxt data is read in and stored
var result;

// Set to false after draw is entered for the first time
var firstDraw = true;

// The word to generate graph for
// Eventually, this should be replaced with a user-input value
var graphWord = 'person';


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
 * Basic setup
 */
function setup() {
  createCanvas(620, 400);  
  stroke(55);
  frameRate(30);
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
  return newData;
}

/**
 * Recursive function to draw the tree
 */
function draw_tree_right(depth, w, h, direction, node) {

  if (node == undefined) { return; }

  // base-cases
  if (w > width) { return; }
  if (h > height) { return; }
  if (h < 0) { return; }

  // 2= both, 1= up, 0 = down
  if (direction == 2 || direction == 1) { line(w, h, w+tW, h+tH); }
  if (direction == 2 || direction == 0) { line(w, h, w+tW, h-tH); }

  // draw the nodes
  print(w + ' ' + h + ' wh');
  fill(250, 200, 200, 100);
  ellipse(w, h, 20, 20);
  fill(0, 0, 0, 255);
  text(node.phrase, w, h);

  if (node!= undefined && node.children != undefined && node.children.length > 0) {
    for (var i = 0; i < node.children.length; i++) {
      draw_tree_right(depth+1, w+tW, h+tH, 1, node.children[i]);
      draw_tree_right(depth+1, w+tW, h+tH, 0, node.children[i]);
    }
  }

  // recurse
  //draw_tree_right(depth+1, w+tW, h+tH, 1);
  //draw_tree_right(depth+1, w+tW, h-tH, 0);
}
  
var root = undefined;

function build_graph_for_recursive(word, data, index, depth, graph) {
  
  // recursive base-cases
  if (depth > 4) { return; }
  if (data.length <= index+1) { return; }

  // find existing or create new node and add to graph
  var nw = data[index+1];
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
  build_graph_for_recursive(nn.phrase, data, index + 1, depth + 1, nn);
}

/**
 * graph is an out-param
 */
function build_graph_for_word(word, data) {
  var matching_indexes = [];
  for (var i = 0 ; i < data.length ; i++) {
    if (data[i] == word) { matching_indexes.push(i); }
  }
  root = new GN(undefined, word, 3);
  for (var i = 0 ; i < matching_indexes.length ; i++) {
    build_graph_for_recursive(word, data, matching_indexes[i], 0, root);
  }
  return root;
}

/**
 * The primary animation loop
 */
function draw() { 

  if (firstDraw) {
    firstDraw = false;
    var nd = process_data(result);
    root = build_graph_for_word(graphWord, nd);
    print('---');
    root.print(1, root);
  }
  background(255);
  draw_tree_right(1, (depthL/depthR) * (width/2), height/2, 2, root);
  //tW=mouseX/2 + 40;
  //tH=mouseY/2 + 40;
} 

