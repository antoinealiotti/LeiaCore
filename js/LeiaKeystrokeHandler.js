/**
 * Constants
 * **/
var KEY = {
        ESC:27,
        SPACE:32,
        LEFT:37,
        UP:38,
        RIGHT:39,
        DOWN:40,
        SHIFT:16,
        TILDE:192,
        ONE:49,
        TWO:50,
        THREE:51,
        ENTER:13,
        A:65,
        C:67,
        S:83,
        T:84,
        U:85,
        V:86,
        W:87,
        K:75,
        L:76,
        B:66 };
/**
 * Example usage:
 *
 * var lks = new LeiaKeystrokeHandler(threeScene, leiaHoloScreen, leiaRenderer, useReservedKeys);
 * lks.addKeyHandler('t', function(event){
 *     console.log(event.keyCode + " was pressed");
 * });
 *
 * @constructor
 */
function LeiaKeystrokeHandler(threeScene, leiaHoloScreen, leiaRenderer, useReservedKeys) {
    var keyHandlers = [];

    this.onKeyDown = function(event) {
        var kc = event.keyCode;
        if( keyHandlers[kc] !== undefined ) {
            keyHandlers[kc](event);
        }
    };

    this.addKeyHandler = function(key, handlerFunction) {
        var keyCode = key.toUpperCase().charCodeAt(0);
        keyHandlers[keyCode] = handlerFunction;
    };

    this.addKeyHandlerForCharCode = function(keyCode, handlerFunction) {
        keyHandlers[keyCode] = handlerFunction;
    };

    document.addEventListener('keydown', this.onKeyDown, false);

    if(useReservedKeys) {
        console.log("LeiaKeystrokeHandler: Initializing with LEIA reserved keys turned -->> ON <<--");
        this.addKeyHandler("a", function(){ // toggle between swizzle and tile mode
            leiaRenderer.toggleSwizzle();
        });
        this.addKeyHandler("i", function(){ // move canvas by 1 pixel in y
            leiaRenderer.shiftY(1);
        });
        this.addKeyHandler("j", function(){ // move canvas by -1 pixel in x
            leiaRenderer.shiftX(-1);
        });
        this.addKeyHandler("k", function(){ // move canvas by -1 pixel in y
            leiaRenderer.shiftY(-1);
        });
        this.addKeyHandler("l", function(){ // move canvas by 1 pixel in x
            leiaRenderer.shiftX(1);
        });
        this.addKeyHandler("p", function(){ // save canvas as image: holoScreenOutput.png
            leiaRenderer.saveCanvas("holoScreenOutput");
        });
        this.addKeyHandler("s", function(){ // toggle between basic and supersample4x mode.
            leiaRenderer.toggleSuperSample();
        });
        this.addKeyHandlerForCharCode(KEY.SPACE, function(){ // toggle between animation on/off
            leiaRenderer.toggleIsAnimating();
        });
        this.addKeyHandlerForCharCode(KEY.TILDE, function(){ // toggle between basic and supersample4x mode.
            leiaRenderer.toggleMultiViewModes();
        });
        this.addKeyHandlerForCharCode(KEY.ONE, function(){ // toggle between basic and supersample4x mode.
            leiaRenderer.modifyBaseline(-1);
        });
        this.addKeyHandlerForCharCode(KEY.TWO, function(){ // toggle between basic and supersample4x mode.
            leiaRenderer.modifyBaseline(1);
        });
        this.addKeyHandlerForCharCode(KEY.THREE, function(){ // toggle between basic and supersample4x mode.
            leiaRenderer.toggle2D3D();
        });
    }
}