
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
var graphWord = 'Lord';


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
  createCanvas(620, 1000);  
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
  print(newData);
  return newData;
}
  
function get_node_h(tl, bl) {
  return tl + ((bl - tl)/2.0);
}

/**
 * Recursive function to draw the tree
 */
function draw_tree_right(depth, top_limit, bot_limit, w, node) {

  if (node == undefined) { return; }

  // draw the node
  noStroke();
  fill(200, 250, 200, 200);
  var h = get_node_h(top_limit, bot_limit);
  //print("  ".repeat(depth) + "dwh = " + depth + "   " + w + " " + h);
  //print("  ".repeat(depth) + "tb = " + top_limit + " " + bot_limit);
  ellipse(w, h, 20, 20);
  fill(0, 0, 0, 255);
  text(node.phrase, w, h);

  var nc = node.children.length;

  if (node!= undefined && node.children != undefined && node.children.length > 0) {
    for (var i = 0; i < node.children.length; i++) {
      var size = ((bot_limit - top_limit) / nc);
      var nbl = top_limit + (size * (i+1));
      var ntl = top_limit + (size * i);
      strokeWeight(3);
      stroke(100, 100, 200, 150);
      line(w, h, w+70, get_node_h(ntl, nbl));
      draw_tree_right(depth+1, ntl, nbl, w + 70, node.children[i]);
    }
  }
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
  draw_tree_right(1, 0, height, 20, root);
  //tW=mouseX/2 + 40;
  //tH=mouseY/2 + 40;
} 

