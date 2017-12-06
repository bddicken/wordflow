/**
 * @author Benjamin Dicken (bddicken)
 * @credits
 *   The original Java version of this class was written by Bohumir Zamecnik in Java.
 *   I (Benjamin) translated it to javascript.
 * @license MIT
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 *   INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 *   PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 *   FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 *   OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 *   DEALINGS IN THE SOFTWARE.
*/

var DIR_UP = new p5.Vector(0, -1);
var DIR_DOWN = new p5.Vector(0, 1);
var DIR_LEFT = new p5.Vector(-1, 0);
var DIR_RIGHT = new p5.Vector(1, 0);

class PanZoomController {
  
  constructor() {
    this.panVelocity = 40;
    this.scaleVelocity = 0.01;
    this.minLogScale = -5;
    this.maxLogScale = 5;
    this.logScale = 0;
    this.scale = 1;
    this.pan = new p5.Vector();
    //this.p;
  }

/*
  public PanZoomController(PApplet p) {
    this.p = p;
  }
*/

  mouseDragged(mouseX, mouseY, pmouseX, pmouseY) {
    var mouse = new p5.Vector(mouseX, mouseY);
    var pmouse = new p5.Vector(pmouseX, pmouseY);
    this.pan.add(p5.Vector.sub(mouse, pmouse));
  }

/*
  public void keyPressed() {
    if (p.key == PConstants.CODED) {
      switch (p.keyCode) {
        case PApplet.UP:
          moveByKey(DIR_UP);
          break;
        case PApplet.DOWN:
          moveByKey(DIR_DOWN);
          break;
        case PApplet.LEFT:
          moveByKey(DIR_LEFT);
          break;
        case PApplet.RIGHT:
          moveByKey(DIR_RIGHT);
          break;
      }
    }
  }
*/

  mouseWheel(step) {
    this.logScale = constrain(this.logScale + step * this.scaleVelocity, 
      this.minLogScale, 
      this.maxLogScale);
    var prevScale = this.scale;
    this.scale = Math.pow(2, this.logScale);

    var mouse = new p5.Vector(mouseX, mouseY);
    this.pan = p5.Vector.add(mouse,
        p5.Vector.mult(p5.Vector.sub(this.pan, mouse), this.scale / prevScale));
  }

/*
  private void moveByKey(PVector direction) {
    pan.add(p5.Vector.mult(this.direction, this.panVelocity));
  }
*/

  getScale() {
    return this.scale;
  }

  setScale(scale) {
    this.scale = scale;
  }

  getPan() {
    return this.pan;
  }

  setPan(pan) {
    this.pan = pan;
  }

  setPanVelocity(panVelocity) {
    this.panVelocity = panVelocity;
  }

  setScaleVelocity(scaleVelocity) {
    this.scaleVelocity = scaleVelocity;
  }

  setMinLogScale(minLogScale) {
    this.minLogScale = minLogScale;
  }

  setMaxLogScale(maxLogScale) {
    this.maxLogScale = maxLogScale;
  }
}

