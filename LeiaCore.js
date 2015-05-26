//LeiaCore Version
'use strict';
var REVISION = "0.0.001";

var LEIA = {
    MULTIVIEW_MODES : {
        FLAT  : 'flat',
        TVH   : 'twoViewHorizontal',
        BASIC : 'basic',
        SS4X  : 'supersample4x'
    },
    RENDER_MODES : {
        TILES   : 1,
        SWIZZLE : 2
    }
};

/**
 * LeiaDisplay
 *
 * @param url
 * @constructor
 */
function LeiaDisplayInfo(url) {
    this.version = REVISION;
    var self = this;
    function loadDisplaySettings(url) {
        var request = new XMLHttpRequest;
        request.open('GET', url, false);
        request.send(null);
        if (request.status === 200) {
            var data = JSON.parse(request.responseText);
            self.info                   = data.info;
        } else {
            throw new Error('LeiaCore: Cannot read file ', url);
        }
    }
    if (url == undefined) {
        throw new Error('LeiaCore: must define configuration file when initializing LeiaDisplay().')
    } else {
        loadDisplaySettings(url);
    }
}

/**
 * LeiaHoloScreen
 *
 * @param leiaDisplay
 * @param parameters
 * @constructor
 */
function LeiaHoloScreen(leiaDisplay, parameters) {
    this.version             = REVISION;
    this.projectionMatrices  = [];
    this.modes               = {};
    this.multiViewParameters = {};
    var mvp                  = this.multiViewParameters;
    var info                 = leiaDisplay.info;
    mvp.displayType          = info.displayType;
    mvp.canvasRotation       = info.canvasRotation;
    mvp.displayResolution    = new THREE.Vector2(info.displayResolution.x, info.displayResolution.y);
    mvp.aspectRatio          = info.displayResolution.x/info.displayResolution.y;
    mvp.numberOfViews        = new THREE.Vector2(info.numberOfViews.x, info.numberOfViews.y);
    var viewResX             = mvp.displayResolution.x / mvp.numberOfViews.x;
    var viewResY             = mvp.displayResolution.y / mvp.numberOfViews.y;
    mvp.viewResolution       = new THREE.Vector2(viewResX, viewResY);
    mvp.tileResolution       = new THREE.Vector2(viewResX, viewResY);
    if (mvp.displayType == "diamond") {
        mvp.tileResolution       = new THREE.Vector2(2*viewResX, viewResY);
    }
    this.center              = new THREE.Vector3(0, 0, 1);  // screen center location
    this.normal              = new THREE.Vector3(0, 0, 1);  // screen normal: unit vector pointing from the screen center to the camera array center
    this.up                  = new THREE.Vector3(0, 1, 0);  // positive vertical direction of the screen: y axis
    this.cameraShift         = new THREE.Vector2(0, 0);     // shift of the camera block with respect to its center
    this.distanceToCamera    =   1000;                      // distance between holo screen and the plane containing the multiview cameras.
    this.nearPlane           =    100;                      // with respect to the screen; positive numbers are in front of the screen.
    this.farPlane            =   -100;                      // with respect to the screen; negative numbers are behind the screen.
    this.baselineScaling     =      1;                      // stretch factor of the camera array
//    this.maxDisparity               5;                      // to be implemented
    this.height              =     30;                      // height of holo screen in webGL units
    this.width               = this.height*mvp.aspectRatio; // width of holo screen in webGL units
    this.matricesNeedUpdate  =   true;                      // matrices will be generated upon first render
    this.currentMode         =   null;                      // needs to be set by renderer
    var lhs = this;

    function multiViewMode(leiaDisplay, parameters) {
        this.modeId                 = null;     // name/identifier of the current mode
        this.viewDirections         = null;     // emission Pattern of this mode (typically the green channel specified in the display configuration file.)
        this.matrix                 = null;     // blurring/sharpening kernel
        this.matrixTileStep         = null;     // view spacing when applying the kernel: 0.5 means supersampled grid, 1 means normal grid.
        this.numberOfTiles          = null;     // number of tiles that are rendered in this mode
        this.numberOfTilesOnTexture = null;     // number of tiles that are rendered on each texture
        this.numberOfTextures       = null;     // number of textures necessary to render all tiles.

        this.initFlatCamera = function(leiaDisplay, parameters) {
            this.numberOfTiles          =   new THREE.Vector2(1, 1);
            this.numberOfTilesOnTexture =   this.numberOfTiles;
            this.numberOfTextures       =       1;
            this.matrix                 =   [[1]];
            this.matrixTileStep         =   new THREE.Vector2(1, 1);

            this.viewDirections.push(new THREE.Vector3(0, 0, 1));
        };

        this.initBasicCamera = function(leiaDisplay, parameters) {
            this.numberOfTiles          = lhs.multiViewParameters.numberOfViews;
            this.numberOfTilesOnTexture = this.numberOfTiles;
            this.numberOfTextures       =       1;
            this.matrix                 =   [[1]];
            this.matrixTileStep         =   new THREE.Vector2(1, 1);

            var emissionPattern = leiaDisplay.info.emissionPatternG;
            for (var q=0; q<emissionPattern.length; q++){
                this.viewDirections.push(new THREE.Vector3(emissionPattern[q].x, emissionPattern[q].y, 1));
            }
        };

        this.initHPOCamera = function(leiaDisplay, parameters) {
            this.numberOfTiles          = new THREE.Vector2(lhs.multiViewParameters.numberOfViews.x, 1);
            this.numberOfTilesOnTexture = this.numberOfTiles;
            this.numberOfTextures       =       1;
            this.matrix                 =   [[1]];
            this.matrixTileStep         =   new THREE.Vector2(1, 1);
        };

        this.initVPOCamera = function(leiaDisplay, parameters) {
            this.numberOfTiles          = new THREE.Vector2(1, lhs.multiViewParameters.numberOfViews.y);
            this.numberOfTilesOnTexture = this.numberOfTiles;
            this.numberOfTextures       =       1;
            this.matrix                 =   [[1]];
            this.matrixTileStep         =   new THREE.Vector2(1, 1);
        };

        this.initTVHCamera = function(leiaDisplay, parameters) {
            this.numberOfTiles          = new THREE.Vector2(2, 1);
            this.numberOfTilesOnTexture = this.numberOfTiles;
            this.numberOfTextures       =       1;
            this.matrix                 =   [[1]];
            this.matrixTileStep         =   new THREE.Vector2(1, 1);
            var emissionPattern = leiaDisplay.info.emissionPatternG;
            var nViews  = new THREE.Vector2(lhs.multiViewParameters.numberOfViews.x, lhs.multiViewParameters.numberOfViews.y);
            var xleft   = nViews.x/2-1;
            var xright  = nViews.x/2;
            var yabove  = nViews.y/2;
            var ybelow  = nViews.y/2-1;
            var posA    = emissionPattern[nViews.x*yabove+xleft];
            var posB    = emissionPattern[nViews.x*yabove+xright];
            var posC    = emissionPattern[nViews.x*ybelow+xleft];
            var posD    = emissionPattern[nViews.x*ybelow+xright];
            var leftPos = {
                x: 0.5*(posA.x + posC.x),
                y: 0.5*(posA.y + posC.y)
            };
            var rightPos = {
                x: 0.5*(posB.x + posD.x),
                y: 0.5*(posB.y + posD.y)
            };
            this.viewDirections.push(new THREE.Vector3(leftPos.x, leftPos.y, 1));
            this.viewDirections.push(new THREE.Vector3(rightPos.x, rightPos.y, 1));
        };

        this.initTVVCamera = function(leiaDisplay, parameters) {
            this.numberOfTiles          = new THREE.Vector2(1, 2);
            this.numberOfTilesOnTexture = this.numberOfTiles;
            this.numberOfTextures       = 1;
            this.matrix                 = [[1]];
            this.matrixTileStep         = new THREE.Vector2(1, 1);
        };

        this.initSS2XCamera = function(leiaDisplay, parameters) {
            this.numberOfTiles          = lhs.multiViewParameters.numberOfViews;
            this.numberOfTilesOnTexture = this.numberOfTiles;
            this.numberOfTextures       = 1;
            this.matrix                 = [[1]];
            this.matrixTileStep         = new THREE.Vector2(1, 1);
        };

        this.initSS4XCamera = function(leiaDisplay, parameters) {
            var ntx                     = 2*lhs.multiViewParameters.numberOfViews.x + 1;
            var nty                     = 2*lhs.multiViewParameters.numberOfViews.y + 1;
            this.numberOfTiles          = new THREE.Vector2(ntx, nty);
            this.numberOfTilesOnTexture = this.numberOfTiles;
            this.numberOfTextures       = 1;
            var a =  0.7;
            var b =  0.125;
            var c = -0.05;
            this.matrix                 = [[c, b, c], [b, a, b], [c, b, c]];
            this.matrixTileStep         = new THREE.Vector2(0.5, 0.5);
            var emissionPattern = leiaDisplay.info.emissionPatternG;
            for (var viewIdY=0; viewIdY<this.numberOfTiles.y; viewIdY++){
                for (var viewIdX=0; viewIdX<this.numberOfTiles.x; viewIdX++){
                    this.viewDirections.push(this.computeSS4XPosition(emissionPattern, {x:viewIdX, y:viewIdY}));
                }
            }
        };

        this.computeSS4XPosition = function(emPat, gridIndex){
            var pos         = {x:0, y:0, z:1};
            var nViews      = new THREE.Vector2(lhs.multiViewParameters.numberOfViews.x, lhs.multiViewParameters.numberOfViews.y);
            var nTiles      = new THREE.Vector2(2*nViews.x+1, 2*nViews.y+1);
            var origIndex   = new THREE.Vector2(gridIndex.x/2-0.5, gridIndex.y/2-0.5);

            if ( ((gridIndex.x%2)==1)&&((gridIndex.y%2)==1) ) {
                var emPatId = nViews.x*origIndex.y+origIndex.x;
                pos = emPat[emPatId];
            } else {
                var xmin = Math.floor(origIndex.x);
                var ymin = Math.floor(origIndex.y);
                var xmax = Math.ceil(origIndex.x);
                var ymax = Math.ceil(origIndex.y);
                if (xmin < 0)            { xmin = xmax + 1; }
                if (xmax > (nViews.x-1)) { xmax = xmin - 1; }
                if (ymin < 0)            { ymin = ymax + 1; }
                if (ymax > (nViews.y-1)) { ymax = ymin - 1; }

                var idA = {x: xmin, y: ymin};
                var idB = {x: xmax, y: ymin};
                var idC = {x: xmin, y: ymax};
                var idD = {x: xmax, y: ymax};
                
                var emPatIdA = nViews.x*idA.y + idA.x;
                var emPatIdB = nViews.x*idB.y + idB.x;
                var emPatIdC = nViews.x*idC.y + idC.x;
                var emPatIdD = nViews.x*idD.y + idD.x;

                var emPatA = emPat[emPatIdA];
                var emPatB = emPat[emPatIdB];
                var emPatC = emPat[emPatIdC];
                var emPatD = emPat[emPatIdD];
                if (xmin>xmax){
                    if (origIndex.x < 0){
                        pos.x = 0.25*(3*emPatB.x - emPatA.x + 3*emPatD.x - emPatC.x);
                    } else {
                        pos.x = 0.25*(3*emPatA.x - emPatB.x + 3*emPatC.x - emPatD.x);
                    }
                } else {
                    pos.x = 0.25*(emPatA.x + emPatB.x + emPatC.x + emPatD.x);
                }
                if (ymin>ymax){
                    if (origIndex.y < 0) {
                        pos.y = 0.25*(3*emPatC.y - emPatA.y + 3*emPatD.y - emPatB.y);
                    } else {
                        pos.y = 0.25*(3*emPatA.y - emPatC.y + 3*emPatB.y - emPatD.y);
                    }
                } else {
                    pos.y = 0.25*(emPatA.y + emPatB.y + emPatC.y + emPatD.y);
                }

            }

            return new THREE.Vector3(pos.x, pos.y, pos.z);
        };

        this.initCustomCamera = function(leiaDisplay, parameters) {
            this.numberOfTiles          = lhs.multiViewParameters.numberOfViews;
            this.numberOfTilesOnTexture = this.numberOfTiles;
            this.numberOfTextures       =       1;
            this.matrix                 =   [[1]];
            this.matrixTileStep         =   new THREE.Vector2(1, 1);
        };

        this.composeVertexShader = function(renderMode) {
            return this.composeStandardVertexShader(renderMode);
        };
        
        this.composeFragmentShader = function(renderMode) {
            var fragmentShader = "";
            switch (lhs.multiViewParameters.displayType) {
                case "square"  :
                case "diamond" :
                    fragmentShader = this.composeStandardFragmentShader(renderMode);
                    break;
                default: 
                    fragmentShader = this.composeTileViewFragmentShader(renderMode);
                    console.log('LeiaCore: unknown display type. Please use official display configuration files only.');
            }

            return fragmentShader;
        };
        
        this.composeStandardVertexShader = function(renderMode) {
            var vertexShader  = "varying vec2 vUv;\n"+
                                "void main() {\n"+
                                "    vUv = uv;\n"+
                                "    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n"+
                                "}";
            return vertexShader;
        };

        this.composeTileViewFragmentShader = function(renderMode) {
            var fragmentShader  = "varying vec2 vUv;\n";
            fragmentShader     +=  "uniform sampler2D tTexture0;\n";
            fragmentShader     +=  "void main() {\n";
            fragmentShader     += "  gl_FragColor = texture2D(tTexture0, vUv);\n";
            fragmentShader     += "}\n";
            return fragmentShader;
        };

        this.composeStandardFragmentShader = function(renderMode) {
            var mvp             = lhs.multiViewParameters;
            var displayType     = mvp.displayType;
            var canvasRotation  = mvp.canvasRotation;

            var fragmentShader  = "varying vec2 vUv;\n";
            fragmentShader     += "uniform sampler2D tTexture0;\n";
            fragmentShader     += "vec2 pixelCoord, sPixId, viewId;\n";
            if (displayType == "diamond"){
                fragmentShader += "float parityId;\n";
            }
            fragmentShader     += "void idPixel() {\n" ;
            fragmentShader     += "  pixelCoord = vec2(";
            switch (canvasRotation) {
                case "0deg":
                    fragmentShader += "floor(vUv.s*"+mvp.displayResolution.x.toFixed(1)+"),floor((vUv.t)*"+mvp.displayResolution.y.toFixed(1)+")";
                    break;
                case "90deg":
                    fragmentShader += "floor((1.0-vUv.t)*"+mvp.displayResolution.x.toFixed(1)+"),floor((vUv.s)*"+mvp.displayResolution.y.toFixed(1)+")";
                    break;
                default:
                    console.log('Warning: wrong canvas rotation setting in configuration file. Please use official LEIA configuration files only.');
            }
            fragmentShader     += ");\n";
            if (renderMode === LEIA.RENDER_MODES.SWIZZLE) {
                fragmentShader += "  sPixId = vec2(floor(pixelCoord.s/"+mvp.numberOfViews.x.toFixed(1)+"),floor(pixelCoord.t/"+mvp.numberOfViews.y.toFixed(1)+") );\n";
                fragmentShader += "  viewId = vec2(mod(pixelCoord.s,"+mvp.numberOfViews.x.toFixed(1)+"),mod(pixelCoord.t,"+mvp.numberOfViews.y.toFixed(1)+") );\n";
                if (displayType == "diamond") {
                    fragmentShader += "  parityId = mod(sPixId.t, 2.0);\n";
                    fragmentShader += "  if (parityId == 1.0) {\n";
                    fragmentShader += "    sPixId = vec2( floor((pixelCoord.s-4.0)/"+mvp.numberOfViews.x.toFixed(1)+"), floor(pixelCoord.t/"+mvp.numberOfViews.y.toFixed(1)+") );\n";
                    fragmentShader += "    viewId = vec2(   mod((pixelCoord.s-4.0),"+mvp.numberOfViews.x.toFixed(1)+"),   mod(pixelCoord.t,"+mvp.numberOfViews.y.toFixed(1)+") );\n";
                    fragmentShader += "  }\n";
                }
            } else {
                fragmentShader += "  sPixId = vec2(mod(pixelCoord.s,"+mvp.viewResolution.x.toFixed(1)+"),mod(pixelCoord.t, "+mvp.viewResolution.y.toFixed(1)+") );\n";
                fragmentShader += "  viewId = vec2(floor(pixelCoord.s/"+mvp.viewResolution.x.toFixed(1)+"),floor(pixelCoord.t/"+mvp.viewResolution.y.toFixed(1)+") );\n";
            }
            fragmentShader     +=  "}\n";
            fragmentShader     +=  "vec4 getPixel( in vec2 view, in vec2 sPix";
            if (displayType == "diamond"){
                fragmentShader += ", in float parity";
            }
            fragmentShader     +=  ") {\n";

            switch(this.modeId) {
                case LEIA.MULTIVIEW_MODES.FLAT: 
                    fragmentShader +=  "  vec2 viewPos = vec2(0, 0);\n";
                    break;
                case LEIA.MULTIVIEW_MODES.TVH: 
                    var center      =  mvp.numberOfViews.x/2;
                    fragmentShader +=  "  vec2 viewPos;\n";
                    fragmentShader +=  "  if (viewId.s<"+center.toFixed(1)+") {\n";
                    fragmentShader +=  "    viewPos = vec2(0, 0);\n";
                    fragmentShader +=  "  } else {\n";
                    fragmentShader +=  "    viewPos = vec2(1, 0);\n";
                    fragmentShader +=  "  }\n";
                    break;
                case LEIA.MULTIVIEW_MODES.BASIC: 
                    fragmentShader +=  "  vec2 viewPos = viewId;\n";
                    break;
                case LEIA.MULTIVIEW_MODES.SS4X:
                    var maxId = new THREE.Vector2(this.numberOfTiles.x-1, this.numberOfTiles.y-1);
                    fragmentShader +=  "  vec2 viewPos = vec2(1.0, 1.0) + 2.0*view;\n";
                    fragmentShader +=  "  viewPos = vec2( min("+maxId.x.toFixed(1)+", max(0.0, viewPos.s)), min("+maxId.y.toFixed(1)+", max(0.0, viewPos.t)) );\n";
                    break;
                default:
                    throw new Error('Error: fragment shader not implemented for mode ['+this.modeId+']. Initializing flat shader');
                    fragmentShader += "  vec2 viewPos = vec2(0, 0);\n";
            }

            var fraction = {
                 x : 1.0/(mvp.tileResolution.x * this.numberOfTiles.x),
                 y : 1.0/(mvp.tileResolution.y * this.numberOfTiles.y)
            };
            fragmentShader     += "  vec4 res = vec4(1.0, 0.0, 0.0, 1.0);\n";
            switch (displayType){
                case "square":
                    fragmentShader +=  "  vec2 id = vec2( "+fraction.x.toFixed(8)+"*(sPix.s+viewPos.s*"+mvp.tileResolution.x.toFixed(1)+"+0.5) , "+fraction.y.toFixed(8)+"*(sPix.t+viewPos.t*"+mvp.tileResolution.y.toFixed(1)+"+0.5));\n";
                    fragmentShader +=  "  res = texture2D( tTexture0, id );\n";
                    break;
                case "diamond":
                    fragmentShader += "  vec2 idA = vec2( "+fraction.x.toFixed(8)+"*(2.0*sPix.s+viewPos.s*"+mvp.tileResolution.x.toFixed(1)+"+0.5) , "+fraction.y.toFixed(8)+"*(sPix.t+viewPos.t*"+mvp.tileResolution.y.toFixed(1)+"+0.5));\n";
                    fragmentShader += "  vec2 idB;\n";
                    fragmentShader += "  if (parity == 1.0) {\n";
                    fragmentShader += "    idB = vec2( "+fraction.x.toFixed(8)+"*(2.0*sPix.s+0.5+viewPos.s*"+mvp.tileResolution.x.toFixed(1)+"+0.5) , "+fraction.y.toFixed(8)+"*(sPix.t+viewPos.t*"+mvp.tileResolution.y.toFixed(1)+"+0.5));\n";
                    fragmentShader += "  } else {\n";
                    fragmentShader += "    idB = vec2( "+fraction.x.toFixed(8)+"*(2.0*sPix.s-0.5+viewPos.s*"+mvp.tileResolution.x.toFixed(1)+"+0.5) , "+fraction.y.toFixed(8)+"*(sPix.t+viewPos.t*"+mvp.tileResolution.y.toFixed(1)+"+0.5));\n";
                    fragmentShader += "  }\n";
                    fragmentShader += "  res = 0.5 * ( texture2D( tTexture0, idA) + texture2D( tTexture0, idB) ); \n";
                    break;
                default:
                    console.log('Warning: display type in configuration file. Please use official LEIA configuration files only.');

            }
            fragmentShader     += "  return res;\n";
            fragmentShader     +=  "}\n";
            fragmentShader     +=  "void main() {\n";
            fragmentShader     +=  "  idPixel();\n";

            var shaderMatrix = this.matrix;
            var myMax = shaderMatrix.length;
            var mvsx  = this.matrixTileStep.x;
            var mvsy  = this.matrixTileStep.y;
            var mcy   = (myMax-1)/2;
            fragmentShader += "  vec4 pixelRGBA = ";
            if ((myMax % 2) == 0) {
                throw new Error('Cannot compute fragment shader for mode ['+this.modeId+']. Matrix needs to be of dimension (2n+1)x(2m+1); e.g 1x1, 1x3, 3x5, 7x3, etc.')
            }
            for (var myid=0; myid<myMax; myid++){
                var mxMax = shaderMatrix[myid].length;
                if ((mxMax % 2) == 0) {
                    throw new Error('Cannot compute fragment shader for mode ['+this.modeId+']. Matrix needs to be of dimension (2n+1)x(2m+1); e.g 1x1, 1x3, 3x5, 7x3, etc.')
                }
                var mcx = (mxMax-1)/2;
                for (var mxid=0; mxid<mxMax; mxid++){
                    var m = shaderMatrix[myid][mxid];
                    var vsx = mvsx*(mxid-mcx);
                    var vsy = mvsy*(myid-mcy);
                    var viewShiftX = "";
                    var viewShiftY = "";
                    if (Math.abs(vsx)>0) viewShiftX = ((vsx<0)?"":"+") + vsx.toFixed(2);
                    if (Math.abs(vsy)>0) viewShiftY = ((vsy<0)?"":"+") + vsy.toFixed(2);
                    if (Math.abs(m)>0){
                        if ((vsx == 0)&&(vsy==0)) {
                            fragmentShader += "+"+m.toFixed(3)+"*getPixel(viewId, sPixId";
                        } else {
                            fragmentShader += "+"+m.toFixed(3)+"*getPixel(vec2(viewId.s"+viewShiftX+", viewId.t"+viewShiftY+"), sPixId";
                        }
                        if (displayType == "diamond"){
                            fragmentShader += ", parityId";
                        }
                        fragmentShader += ")";
                    }
                }
            }
            fragmentShader     += ";\n";
            fragmentShader     += "  gl_FragColor = pixelRGBA;\n";
            fragmentShader     += "}\n";
            return fragmentShader;
        };
        

        this.init = function (leiaDisplay, parameters) {
            if (parameters === undefined) {
                throw new Error('multiViewMode needs to be instantiated with parameters. Please see examples.')
            }

            this.viewDirections = [];
            this.modeId = parameters.modeId;

            switch (parameters.modeId) {
                case LEIA.MULTIVIEW_MODES.FLAT   : this.initFlatCamera(leiaDisplay, parameters);   break;
                case LEIA.MULTIVIEW_MODES.HPO    : this.initHPOCamera(leiaDisplay, parameters);    break;
                case LEIA.MULTIVIEW_MODES.VPO    : this.initVPOCamera(leiaDisplay, parameters);    break;
                case LEIA.MULTIVIEW_MODES.TVH    : this.initTVHCamera(leiaDisplay, parameters);    break;
                case LEIA.MULTIVIEW_MODES.TVV    : this.initTVVCamera(leiaDisplay, parameters);    break;
                case LEIA.MULTIVIEW_MODES.BASIC  : this.initBasicCamera(leiaDisplay, parameters);  break;
                case LEIA.MULTIVIEW_MODES.SS2X   : this.initSS2XCamera(leiaDisplay, parameters);   break;
                case LEIA.MULTIVIEW_MODES.SS4X   : this.initSS4XCamera(leiaDisplay, parameters);   break;
                case LEIA.MULTIVIEW_MODES.CUSTOM : this.initCustomCamera(leiaDisplay, parameters); break;
            }

        };

        this.init(leiaDisplay, parameters);
    };

    this.checkUpdate = function() {
        if (this.matricesNeedUpdate){
            this.updateProjectionMatrices();
            this.matricesNeedUpdate = false;
        }
    };

    this.calculateProjectionMatrix = function(camPosition) {
        // camPosition is the XY position of sub-camera relative to the camera array center
        var D = this.distanceToCamera;
        var X = {min: -0.5 * this.width, max: 0.5 * this.width};
        var Y = {min: -0.5 * this.height, max: 0.5 * this.height};
        var Z = {max: D-this.farPlane, min: D-this.nearPlane};

        var projectionMatrix = new THREE.Matrix4();

        var m11 = (2*D) / (X.max - X.min);
        var m22 = (2*D) / (Y.max - Y.min);
        var m13 = (X.max + X.min - 2 * camPosition.x) / (X.max - X.min);
        var m23 = (Y.max + Y.min - 2 * camPosition.y) / (Y.max - Y.min);
        var m14 = -(2*D * camPosition.x) / (X.max - X.min);
        var m24 = -(2*D * camPosition.y) / (Y.max - Y.min);
        var m33 = -(Z.max + Z.min) / (Z.max - Z.min);
        var m34 = -2 * Z.max * Z.min / (Z.max - Z.min);
        projectionMatrix.set(
            m11,   0,  m13,  m14,
            0,   m22, m23,  m24,
            0,    0,  m33,  m34,
            0,    0,  -1,    0
        );
        return projectionMatrix;
    };

    this.updateProjectionMatrices = function() {
        this.projectionMatrices = [];
        var nx = this.currentMode.numberOfTiles.x;  // number of cameras along x direction
        var ny = this.currentMode.numberOfTiles.y;  // number of cameras along y direction

        var distanceToScreen    = this.distanceToCamera;  // unit: webgl
        var baselineScaling     = this.baselineScaling;
        var stretchFactor       = distanceToScreen*baselineScaling;
        var camShiftX = this.cameraShift.x;
        var camShiftY = this.cameraShift.y;

        for (var j = 0; j < ny; j++) {
            for (var i = 0; i < nx; i++) {
                var idx = nx*j + i;
                var camPosition = {
                      x: stretchFactor*this.currentMode.viewDirections[idx].x - camShiftX,
                      y: stretchFactor*this.currentMode.viewDirections[idx].y - camShiftY
                };
                var projectionMatrix = this.calculateProjectionMatrix(camPosition);
                this.projectionMatrices.push(projectionMatrix);
            }
        }
        this.isUpdated = true;
    };

    this.setMode = function(mode) {
        this.currentMode = this.modes[mode];
        this.matricesNeedUpdate = true;
    };

    this.setBaseline = function(newBaselineScalingValue) {
        if (this.baselineScaling != newBaselineScalingValue) {
            this.baselineScaling = newBaselineScalingValue;
            this.matricesNeedUpdate = true;
        }
    };

    this.init = function(leiaDisplay, parameters) {
        if (leiaDisplay !== undefined){
            for (var mode in LEIA.MULTIVIEW_MODES){
                this.modes[LEIA.MULTIVIEW_MODES[mode]] = new multiViewMode(leiaDisplay, { modeId: LEIA.MULTIVIEW_MODES[mode]} );
            }
        }
    };

    this.init(leiaDisplay);
}

/**
 * LeiaRenderer
 *
 * @param leiaDisplay
 * @param leiaHoloScreen
 * @param parameters
 * @constructor
 */
function LeiaRenderer(leiaDisplay, leiaHoloScreen, parameters) {
    this.version               = REVISION;
    this.width                 = leiaDisplay.info.displayResolution.x;
    this.height                = leiaDisplay.info.displayResolution.y;
    this.canvasWidth           = null;
    this.canvasHeight          = null;
    this.currentModeId         = LEIA.MULTIVIEW_MODES.BASIC;
    this.renderMode            = LEIA.RENDER_MODES.SWIZZLE;
    this.updateTextureSettings = true;
    this.updateShaders         = true;
    this.debugMode             = false;
    this.isAnimating           = true;
    this.outputScene           = new THREE.Scene;
    this.outputGeometry        = new THREE.PlaneGeometry(this.width, this.height);
    this.outputMesh            = new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), this.currentShaderMaterial)
    this.shifterCookie         = LeiaCookieHandler;
    this.canvasShiftXY         = new THREE.Vector2(this.shifterCookie.getItem('LeiaShiftX'), this.shifterCookie.getItem('LeiaShiftY'));
//    this.canvasShiftXY         = new THREE.Vector2(leiaDisplay.info.canvasShift.x, leiaDisplay.info.canvasShift.y); //new THREE.Vector2(3, 7); // XXX XXX XXX
    this.canvasRotation        = leiaDisplay.info.canvasRotation;
    this.orthoCamera           = new THREE.OrthographicCamera(this.width / -2, this.width / 2, this.height / 2, this.height / -2, -1, 1);
    this.cannedScene           = new THREE.Scene();
    this.currentBaseline       = leiaHoloScreen.baselineScaling;
    this.timer0                = Date.now() * 0.001;
    this.timer1                = Date.now() * 0.001;
    this.timer                 = 0;


    this.setMultiViewMode = function(multiViewMode){
        this.currentModeId          = multiViewMode;
        this.updateTextureSettings  = true;
    };

    this.getMultiViewMode = function(){
        return this.currentModeId;
    };

    this.setRenderMode = function(renderMode){
        this.renderMode             = renderMode;
        this.updateShaderMaterial   = true;
    };

    this.getRenderMode = function(){
        return this.renderMode;
    };

    this.setCannedImage = function(leiaHoloScreen, multiViewMode, url){
        this.setMultiViewMode(multiViewMode);
        leiaHoloScreen.setMode(this.currentModeId);
        console.log('LeiaCore: Preparing shaders for render mode ['+leiaHoloScreen.currentMode.modeId+'].');
        this.textures = [];

        var cm           = leiaHoloScreen.currentMode;
        var mvp          = leiaHoloScreen.multiViewParameters;
        var textureSizeX = cm.numberOfTilesOnTexture.x * mvp.tileResolution.x;
        var textureSizeY = cm.numberOfTilesOnTexture.y * mvp.tileResolution.y;

        for (var textureNumber = 0; textureNumber<cm.numberOfTextures; textureNumber++) {
            this.textures[textureNumber] = new THREE.WebGLRenderTarget(textureSizeX, textureSizeY, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
        }        
        this.prepareShaderMaterial(leiaHoloScreen)
        this.renderer.shadowMapEnabled  = true;
        this.updateTextureSettings      = false;

        var backgroundPlaneTexture = new THREE.ImageUtils.loadTexture(url);
        backgroundPlaneTexture.wrapS = backgroundPlaneTexture.wrapT = THREE.RepeatWrapping;
        backgroundPlaneTexture.repeat.set(1, 1);

        var views = leiaHoloScreen.currentMode.numberOfTiles;
        var cm          = leiaHoloScreen.currentMode;
        var mvp         = leiaHoloScreen.multiViewParameters;
        var textureSizeX = cm.numberOfTilesOnTexture.x * mvp.tileResolution.x;
        var textureSizeY = cm.numberOfTilesOnTexture.y * mvp.tileResolution.y;
        var planeMaterial   = new THREE.MeshBasicMaterial({ map: backgroundPlaneTexture });
        var planeGeometry   = new THREE.PlaneGeometry(mvp.displayResolution.x, mvp.displayResolution.y);
        var plane           = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.castShadow    = true;
        plane.receiveShadow = true;
        this.cannedScene.add(plane);
    };


    this.prepareTextures = function (leiaHoloScreen) {
        leiaHoloScreen.setMode(this.currentModeId);
        console.log('LeiaCore: Preparing shaders for render mode ['+leiaHoloScreen.currentMode.modeId+'].');
        this.textures   = [];
        var cm          = leiaHoloScreen.currentMode;
        var mvp         = leiaHoloScreen.multiViewParameters;
        var textureSizeX = cm.numberOfTilesOnTexture.x * mvp.tileResolution.x;
        var textureSizeY = cm.numberOfTilesOnTexture.y * mvp.tileResolution.y;
        for (var textureNumber = 0; textureNumber<cm.numberOfTextures; textureNumber++){
            this.textures[textureNumber] = new THREE.WebGLRenderTarget(textureSizeX, textureSizeY, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
        }        
        this.prepareShaderMaterial(leiaHoloScreen)
        this.renderer.shadowMapEnabled  = true;
        this.updateTextureSettings      = false;
    };

    this.render = function(scene, leiaHoloScreen) {
        this.timer1 = Date.now() * 0.001;
        if (!this.isAnimating) {
            this.timer0 = this.timer1 - this.timer;
        }
        if ((this.isAnimating) || (this.updateTextureSettings||this.updateShaderMaterial) ) {
            this.timer = this.timer1 - this.timer0;
            this.doRender(scene, leiaHoloScreen);
        }
    };

    this.updateRenderer = function(leiaHoloScreen) {
        if (this.updateTextureSettings){
            this.prepareTextures(leiaHoloScreen);
        } else {
            if (this.updateShaderMaterial){
                this.prepareShaderMaterial(leiaHoloScreen);
            }
        }
        leiaHoloScreen.checkUpdate(leiaHoloScreen);
    };

    this.showImage = function(url, leiaHoloScreen) {
        this.updateRenderer(leiaHoloScreen);
        this.renderer.setClearColor(new THREE.Color().setRGB(0.0, 0.0, 0.0));
        this.renderer.setViewport(0, 0, this.width, this.height);
        this.renderer.setScissor (0, 0, this.width, this.height);
        this.renderer.enableScissorTest(true);
        this.renderer.render(this.cannedScene, this.orthoCamera, this.textures[0], false);
        this.displayOutput();
    };

    this.doRender = function(scene, leiaHoloScreen) {
        this.updateRenderer(leiaHoloScreen);
        this.renderTiles(scene, leiaHoloScreen, this.textures, false);
        this.displayOutput();
    };

    this.displayOutput = function(){
        this.outputScene.remove(this.outputMesh);
        this.outputMesh = new THREE.Mesh(this.outputGeometry, this.currentShaderMaterial)
        this.outputScene.add(this.outputMesh);
        this.renderer.setViewport(0, 0, this.canvasWidth, this.canvasHeight);
        this.renderer.setScissor (0, 0, this.canvasWidth, this.canvasHeight);
        this.renderer.enableScissorTest(true);
        this.renderer.render(this.outputScene, this.orthoCamera);
    };

     this.resetCentralCamera = function(leiaHoloScreen) {
        var cameraFOV = 50;
        var aspectRatio = this.width / this.height;
        this.cameraCenterPosition = new THREE.Vector3(0, 0, leiaHoloScreen.distanceToCamera);
        // (Above settings will be modified by projectionMatrix anyways)

        this.camera = new THREE.PerspectiveCamera(cameraFOV, aspectRatio, this.nearPlane, this.farPlane);
        this.camera.position.copy(this.cameraCenterPosition);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(leiaHoloScreen.center); // XXX XXX XXX CHECK: shouldn't this always point to the origin because it's just to show the swizzled image?? XXX XXX XXX 
    };

    this.composeShaderUniforms = function(leiaHoloScreen) {
        var uniforms={};
        switch (leiaHoloScreen.currentMode.numberOfTextures) {
            case 8: uniforms.tTexture7 = { type: "t", value: this.textures[7] };
            case 7: uniforms.tTexture6 = { type: "t", value: this.textures[6] };
            case 6: uniforms.tTexture5 = { type: "t", value: this.textures[5] };
            case 5: uniforms.tTexture4 = { type: "t", value: this.textures[4] };
            case 4: uniforms.tTexture3 = { type: "t", value: this.textures[3] };
            case 3: uniforms.tTexture2 = { type: "t", value: this.textures[2] };
            case 2: uniforms.tTexture1 = { type: "t", value: this.textures[1] };
            case 1: uniforms.tTexture0 = { type: "t", value: this.textures[0] };
        }
        return uniforms;
    };

    this.renderTiles = function(scene, leiaHoloScreen, textures, forceClear) {
        this.renderer.setClearColor(new THREE.Color().setRGB(0.0, 0.0, 0.0));

        var currentCamera       = this.camera;
        var numberOfTextures    = leiaHoloScreen.currentMode.numberOfTextures;
        var tileResolution      = leiaHoloScreen.multiViewParameters.tileResolution;
        var numberOfTilesX      = leiaHoloScreen.currentMode.numberOfTilesOnTexture.x;
        var numberOfTilesY      = leiaHoloScreen.currentMode.numberOfTilesOnTexture.y;
        var tileId              = 0; 
        var nbrOfTiles          = leiaHoloScreen.currentMode.numberOfTiles.x * leiaHoloScreen.currentMode.numberOfTiles.y;

        for (var textureNumber = 0; textureNumber < numberOfTextures; textureNumber++){
            var textureOffsetPage = textureNumber * numberOfTilesX * numberOfTilesY;

            for (var ty = 0; ty < numberOfTilesY; ty++) {
                var textureOffset = textureOffsetPage + ty*numberOfTilesX;

                for (var tx = 0; tx < numberOfTilesX; tx++) {
                    this.renderer.setViewport(tileResolution.x * tx, tileResolution.y * ty, tileResolution.x, tileResolution.y);
                    this.renderer.setScissor(tileResolution.x * tx, tileResolution.y * ty, tileResolution.x, tileResolution.y);
                    this.renderer.enableScissorTest(true);
                    tileId = textureOffset + tx;
                    if (tileId < nbrOfTiles) {
                        var projectionMatrix = leiaHoloScreen.projectionMatrices[textureOffset + tx];
                        currentCamera.projectionMatrix.copy( projectionMatrix );
                            this.textures[textureNumber].sx = tileResolution.x * tx;
                            this.textures[textureNumber].sy = tileResolution.y * ty;
                            this.textures[textureNumber].w  = tileResolution.x;
                            this.textures[textureNumber].h  = tileResolution.y;
                        this.renderer.render(scene, currentCamera, textures[textureNumber], forceClear);
                    }
                 }
            }
        }
    };

    this.prepareShaderMaterial = function(leiaHoloScreen) {
        var shaderMaterial;
        leiaHoloScreen.setBaseline(this.currentBaseline);
        var shaderUniforms  = this.composeShaderUniforms(leiaHoloScreen);
        var vertexShader    = leiaHoloScreen.currentMode.composeVertexShader(this.renderMode);
        var fragmentShader  = leiaHoloScreen.currentMode.composeFragmentShader(this.renderMode);

        shaderMaterial = new THREE.ShaderMaterial({
            uniforms: shaderUniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            depthWrite: false
        });
        this.currentShaderMaterial  = shaderMaterial;
        this.updateShaderMaterial   = false;
    };

    this.dataURLtoBlob = function(dataURL) {
        var byteString;

        // Convert base64/URLEncoded data component to raw binary data held in a string
        if (dataURL.split(',')[0].indexOf('base64') >= 0) {
            byteString = atob(dataURL.split(',')[1]);
        } else {
            byteString = unescape(dataURL.split(',')[1]);
        }

        var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0]; // Separate out the mime component
        var ia = new Uint8Array(byteString.length); // Write the bytes of the string to a typed array

        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type:mimeString});
    };

    this.saveCanvas = function(prefix) {
        var a = document.createElement("a");
        var filename = prefix + ".png";
        console.log("LeiaCore: creating image file ", filename);
        a.download = filename;
        var blob = this.dataURLtoBlob(leiaRenderer.renderer.domElement.toDataURL("image/png"));
        a.href = (window.URL || window.URL).createObjectURL(blob);
        a.click();
    };

    this.toggleMultiViewModes = function() {
        console.log('LeiaCore: Toggling multiview modes');
        var q = 0;
        var currentId = 0;
        var availableModes  = [];
        for (var mode in LEIA.MULTIVIEW_MODES) {
            var modeId = LEIA.MULTIVIEW_MODES[mode]
            availableModes[q] = mode;
            if (modeId == this.currentModeId){
                currentId = q;
            }
            q++;
        }
        this.setMultiViewMode(LEIA.MULTIVIEW_MODES[availableModes[(currentId+1)%q]]);
    };

    this.toggleSuperSample = function() {
        switch (this.getMultiViewMode()) {
            case LEIA.MULTIVIEW_MODES.BASIC :   this.setMultiViewMode(LEIA.MULTIVIEW_MODES.SS4X);   break;
            case LEIA.MULTIVIEW_MODES.SS4X  :   this.setMultiViewMode(LEIA.MULTIVIEW_MODES.BASIC);  break;
            default:   this.setMultiViewMode(LEIA.MULTIVIEW_MODES.BASIC);  break;
        }
    };

    this.toggle2D3D = function() {
        switch (this.getMultiViewMode()) {
            case LEIA.MULTIVIEW_MODES.BASIC :   this.setMultiViewMode(LEIA.MULTIVIEW_MODES.FLAT);   break;
            case LEIA.MULTIVIEW_MODES.FLAT  :   this.setMultiViewMode(LEIA.MULTIVIEW_MODES.BASIC);  break;
            default:   this.setMultiViewMode(LEIA.MULTIVIEW_MODES.FLAT);  break;
        }
    };

    this.toggleIsAnimating = function() {
        this.isAnimating = !this.isAnimating;
        if (this.isAnimating){
            this.setMultiViewMode(LEIA.MULTIVIEW_MODES.BASIC);
        } else {
            this.setMultiViewMode(LEIA.MULTIVIEW_MODES.SS4X);
            this.doRender(scene, leiaHoloScreen);
        }
    };

    this.importShaderMatrix = function(url) {
        var request = new XMLHttpRequest;
        request.open('GET', url, false);
        request.send(null);
        var m;
        if (request.status === 200) {
            var data = JSON.parse(request.responseText);
            m = data.matrix;
        } else {
            throw new Error('LeiaCore: Cannot read shader matrix file ', url);
        }
        return m;
    };

    this.toggleSwizzle = function() {  // Single, Tiled, Swizzle
        switch (this.getRenderMode()){
            case LEIA.RENDER_MODES.TILES    :   this.setRenderMode(LEIA.RENDER_MODES.SWIZZLE);    break;
            case LEIA.RENDER_MODES.SWIZZLE  :   this.setRenderMode(LEIA.RENDER_MODES.TILES);    break;
        }
    };

    this.modifyBaseline = function(id) {  // Single, Tiled, Swizzle
        if (this.getMultiViewMode() != LEIA.MULTIVIEW_MODES.FLAT){
            switch (id){
                case  1 :   this.currentBaseline += 0.2 ;    break;
                case -1 :   this.currentBaseline -= 0.2 ;    break;
            }
            if (this.currentBaseline < 0) {
                this.currentBaseline = 0;
            }
            if (this.currentBaseline > 2) {
                this.currentBaseline = 2;
            }
            this.updateShaderMaterial = true;
        }
    };

    this.shiftX = function(shiftX) {
        this.canvasShiftXY.x = (this.canvasShiftXY.x + shiftX + 8) % 8; //leiaDisplay.numberOfViews.x;
        this.setCanvasShift();
    };

    this.shiftY = function(shiftY) {
        this.canvasShiftXY.y = (this.canvasShiftXY.y + shiftY + 8) % 8; //leiaDisplay.numberOfViews.x;
        this.setCanvasShift();
    };

    this.setCanvasShift = function(){
        var shiftX = this.canvasShiftXY.x;
        var shiftY = this.canvasShiftXY.y;
        this.shifterCookie.setItem('LeiaShiftX', shiftX);
        this.shifterCookie.setItem('LeiaShiftY', shiftY);
        var canRot = this.canvasRotation;
        setTimeout( function() {
            var canvas = document.getElementsByTagName("canvas");
            switch (canRot) {
                case "0deg":
                    canvas[0].style.setProperty("transform", "translate("+shiftX.toFixed(2)+"px, "+shiftY.toFixed(2)+"px) ", null); 
                    break;
                case "90deg":
                    canvas[0].style.setProperty("transform", "translate("+shiftY.toFixed(2)+"px, "+shiftX.toFixed(2)+"px) ", null); 
                    break;
                default:
                    console.log('Warning: wrong canvas rotation setting in configuration file. Please use official LEIA configuration files only.');
            }
        }, 0);
    };

    this.init = function(leiaDisplay, leiaHoloScreen, parameters) {
        this.setCanvasShift();
        this.outputScene.add(this.outputMesh);
        this.renderer = new THREE.WebGLRenderer({
            antialias:false,
            preserveDrawingBuffer: true,
            devicePixelRatio: 1,
        });
        if (this.debugMode){
            console.log('Warning: initializing LeiaCore in debug mode.')
        }
        switch (leiaHoloScreen.multiViewParameters.canvasRotation) {
            case "0deg":
                this.renderer.setSize(this.width, this.height);
                this.canvasWidth  = this.width;
                this.canvasHeight = this.height;
                break;
            case "90deg":
                this.renderer.setSize(this.height, this.width);
                this.canvasWidth  = this.height;
                this.canvasHeight = this.width;
                break;
            default:
                console.log('Warning: wrong canvas rotation setting in configuration file. Please use official LEIA configuration files only.');
        }
        this.resetCentralCamera(leiaHoloScreen);
    };

    this.init(leiaDisplay, leiaHoloScreen);
}


