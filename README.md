<img src="http://myleia.com/github/LeiaGitHub.png"/>

Want to be a pioneer in interactive holographic design? Write the first mobile holographic apps and be remembered for the ages?

Well here is your chance! :-)

[LEIA](https://www.leiainc.com) has developed an API, [LeiaCore](https://github.com/LeiaInc/LeiaCore), using [WebGL](https://www.khronos.org/webgl) and [THREE.js](http://threejs.org) making it super easy to create interactive holographic content running directly in your browser. You can write code from scratch, or adapt existing [WebGL](https://www.khronos.org/webgl) and [THREE.js](http://threejs.org) based apps. In essence, the main difference between standard code and our 3D code is using our holographic renderer function instead of the standard renderer.

Not only will your designs come to life on our display, you’ll also get the chance to interact with them using a variety of cool new user interfaces such as the [Leap Motion Controller™](https://developer.leapmotion.com), [Intel® RealSense™ 3D cameras](http://www.intel.com/RealSense), hovering panels, even our very own holographic camera. You can use existing JavaScript plug-ins, or write your own to integrate the device of your choice to our ecosystem.

We will invite the best future holographers to our [Menlo Park headquarters](https://www.google.com/maps/place/2440+Sand+Hill+Rd+%23303,+Menlo+Park,+CA+94025/@37.4220027,-122.2039758,17z) to try our latest prototypes while we are still in stealth mode.

Have a look at [our website](https://www.leiainc.com) to read our [BLOG](https://www.leiainc.com/blog), browse and even try editing some of our example applications in the Alpha version of our [IDE](http://ide.leiainc.com/), [download our holographic 3D creation guidelines](https://www.leiainc.com/wp-content/uploads/2014/11/Holographic-content-creation-guidelines.pdf) for an overview of the technology involved in the [LEIA](https://www.leiainc.com) display, and get more details on where the [LEIA](https://www.leiainc.com) platform is headed in general.

Welcome to the holographic future!

# LeiaCore API #

We'd like to give you, the developer, the smoothest possible onramp to implementing some basic 3D functionality using the LeiaCore library that will render as a three dimensional hologram on a [LEIA](https://www.leiainc.com) display.

Exposure and experience with the [THREE.js](http://threejs.org) library will help you immeasurably in quickly understanding how to best create more complex 3D scenes for Leia holographic devices, as the core library heavily leverages [THREE](http://threejs.org) for anything involving custom content creation.

It is also possible to use pre-rendered content and have it appear holographically, however in most cases its more ideal to render your content as [THREE.js](http://threejs.org) vector primitives for optimum design flexibility and rendering performance.

### Demo/Example Quick Links ###

**[Single Shape](https://github.com/LeiaInc/LeiaCore/blob/master/README.md#getting-started)**

**[Multiple Shapes](https://github.com/LeiaInc/LeiaFourShapeScene)**

**[Basic Animation](https://github.com/LeiaInc/BasicAnimation)**

**[Basic Visual Effects](https://github.com/LeiaInc/LeiaBasicShadowEffect)**

## Getting Started ##

First, there are a few things you are going to need to have installed and be familiar with in order to be able to write and run our examples. We will be doing almost everything from the [bash terminal](http://en.wikipedia.org/wiki/Terminal_%28OS_X%29) (Mac) typically located in /Applications/Utilities/Terminal.app, or the command line ([CMD](http://en.wikipedia.org/wiki/Cmd.exe)) if you are on Windows. 

**Windows Users:** A quick shortcut to running CMD is to simply hold the Windows key, and type the letter "R". This will get you a "Run" window. Then just type "cmd.exe" in this window and hit the enter key to launch an instance of the Windows command line interface. 

### Installing Git ###

This isn't a requirement to run our demonstration code, but if you want to have full working copies of the source code for the examples, and/or the API itself locally on your computer, the next few steps are necessary to achieve this. First, you need to have [git](http://git-scm.com/) installed in order to get the Leia projects from GitHub. 

GitHub has an [excellent tutorial](https://help.github.com/articles/set-up-git) on installing and configuring [git](http://git-scm.com/) on your system. We highly recommend reading this and following its instructions first. Once you have git installed and configured on your system, then you can continue with the rest of our tutorial.

### Running The Examples ###

You'll also need a local HTTP/web server to run our examples to avoid local file access restrictions due to almost all modern browser default security settings. 

**Mac:** If you are on a Mac, you're in luck since python comes preinstalled, and all you need do is run the following command from the same directory you saved your example code to.

        $ python -m SimpleHTTPServer
 
This will start a local web server on port 8000 (the default) from whatever directory it was run from on your system. Then all you need to do is go to [http://localhost:8000](http://localhost:8000) in your web browser to see the example run.

**Windows:** Windows users would ideally have NodeJS and NPM installed already. If not, go to the Node website, and install the stable release of Node immediately. :-) Node/NPM come as a bundle with the main installer for all supported platforms.

Once Node and NPM are installed, use NPM to install the http-server Node module by issuing the following command in your terminal/command line:

#### Mac ####

        $ sudo npm install http-server -g

#### Windows ####

        $ npm install http-server -g

#### Mac/Windows ####

Now simply navigate to the directory on your local filesystem you want to serve your code example from, and start http-server by running the following command in your terminal/command line with the following command:

        $ http-server -d

With that done, you should be able to point your web browser at [http://localhost:8080](http://localhoist:8080) and see a directory listing of all of the files in the directory you started http-server in.

### How To Use The Code ###

All of our coding examples are simply plain text and can be created and edited in any basic text editor of your choice. Most of us opt for our favorite IDE (integrated development environment) such as [Eclipse](http://www.eclipse.org/), [IntelliJ](https://www.jetbrains.com/idea/), [WebStorm](https://www.jetbrains.com/webstorm/), etc. You can also just as easily use one of the built in text editors for your operating system, such as [TextEdit](http://en.wikipedia.org/wiki/TextEdit), [Notepad](http://en.wikipedia.org/wiki/Notepad_%28software%29), [vim/vi](http://en.wikipedia.org/wiki/Vim_%28text_editor%29), [emacs](http://en.wikipedia.org/wiki/Emacs), etc. The main difference is you don't get intelligent code highlighting/helpers with a basic text editor, but the main function still accomplishes the same goal; editing and saving a text file.

### Setting Up To Code ###

Most of our work will be done in JavaScript, but we need to create a mechanism to be able to have our web browser load the required libraries, as well as run our LeiaCore code, so we'll create a very basic HTML page for handling this. 

Simply open your editor of choice, and copy/paste the code below into a new file and name it something like index.html (if you want the http/web server you just installed to load it automatically from the directory its serving files from).

      <!DOCTYPE html>
      <head>
          <meta charset="utf-8">
          <title>Single Shape Demo Example</title>
          <style type="text/css">
          body {
              overflow: hidden;
          }
          </style>
          <script src="https://www.leiainc.com/build/LeiaCore-latest.min.js"></script>
          <script src="https://www.leiainc.com/build/LeiaCoreUtil/js/helvetiker_regular.typeface.js"></script>
          <script src="https://www.leiainc.com/build/LeiaCoreUtil/js/helvetiker_bold.typeface.js"></script>
      </head>
      <body style="margin: 0 0 0 0;"></body>
            <script>
              // LeiaCore Code Goes Here!
            </script>
      </html>
      
[This file](https://github.com/LeiaInc/LeiaSingleShape/blob/master/index.html), as well as the rest of the files for this example are available for viewing or download in the [LeiaSingleShape](https://github.com/LeiaInc/LeiaSingleShape) repository.

Ultimately we are looking to arrive at an instance of [THREE.Scene()](http://threejs.org/docs/#Reference/Scenes/Scene) that will contain our visual environment space. In order to do this, we need to construct its dependent objects; [LeiaDisplayInfo()](https://github.com/LeiaInc/LeiaCore/wiki#leiadisplay), [LeiaHoloScreen()](https://github.com/LeiaInc/LeiaCore/wiki#leiavirtualscreen), and [LeiaRenderer()](https://github.com/LeiaInc/LeiaCore/wiki#leiarenderer). Full documentation of these objects is described in the [LeiaCore Wiki](https://github.com/LeiaInc/LeiaCore/wiki). You can learn the extent of their full capability there, but we'll just focus on instantiating and using them in this example.

Now lets go through an example of what it takes to render the simplest single shape scene using LeiaCore and [THREE.js](http://threejs.org).

Let's do it!

## Build The LeiaCore Objects ##

    var leiaDisplayInfo = new LeiaDisplayInfo('https://www.leiainc.com/latest/LeiaCore/config/displayPrototypeSmall.json');

We now have an instance of LeiaDisplayInfo() as leiaDisplayInfo. This example assumes we are using the displayPrototypeSmall.json LEIA display driver. There are and will be more device driver files such as displayPrototypeSmall.json in the future. Simply choose the appropriate device driver file, and pass its path to LeiaDisplayInfo().

Through this instance, we will be able to communicate with the physical device. At the moment all device I/O can be considered read-only. However, we need to retain a hook to the hardware to move to the next step, which is constructing a LeiaHoloScreen() instance. Let's see how thats done now.

    leiaHoloScreen = new LeiaHoloScreen(leiaDisplayInfo);

Simply pass the instance of LeiaDisplayInfo() to LeiaHoloScreen() and voila! We now have an instance of LeiaHoloScreen() as leiaHoloScreen. 

Finally, we need an instance of LeiaRenderer() in order to actually output our scene to our LEIA display. Lets build one!

    var leiaRenderer = new LeiaRenderer(leiaDisplayInfo, leiaHoloScreen);

We now have instances of all three essential LieaCore objects to be able to render our 3D scene onto our LEIA display. Now is a good time to construct an instance THREE.Scene(). Since we've already configured our project to include the THREE library in the root namespace, this is simply done with:

    var scene = new THREE.Scene();

Your script block at the bottom of your HTML file should look exactly like this at this point:

    <script>
        // Build The LeiaCore Objects
        var leiaDisplayInfo = new LeiaDisplayInfo('https://www.leiainc.com/latest/LeiaCore/config/displayPrototypeSmall.json');
        var leiaHoloScreen  = new LeiaHoloScreen(leiaDisplayInfo);
        var leiaRenderer    = new LeiaRenderer(leiaDisplayInfo, leiaHoloScreen);
        var scene = new THREE.Scene();
    </script>

**Note:** Its usually a good idea to build at least one THREE group in advance, to contain some or all of your visual objects to make it easier to move or otherwise manipulate them. Since we're only dealing with one visual object in this example, we can omit doing this for now. Don't worry, we'll show you how to make extensive use of groups in later examples.

## Connect LeiaRenderer To The Page ##

Next we need to connect the LeiaRenderer to the page we are generating our new 3D scene on. In order to do this simply place this line of code directly beneath the ones we just wrote:

        document.body.appendChild(leiaRenderer.renderer.domElement);
        
This wires the internal DOM element that LeiaRenderer uses for its output to the base page you are loading in your browser.

## Generate A Cube ##

Now we need to actually build something to send to our new scene. Lets start with a single cube, and see what it takes to place it into our new basic scene.

First we'll need to define what kind of geometry we'll be building a displayable 3d object for. THREE provides a whole assortment of prebuilt primitives for us to use to base any other more complex shape out of. For now lets just focus on rendering one though. In order to draw a cube, first we instantiate a THREE [BoxGeometry()](http://threejs.org/docs/#Reference/Extras.Geometries/BoxGeometry) thusly:

    var boxGeometry = new THREE.BoxGeometry(3, 3, 3);

This gives us a 3x3x3 (x:3, y:3, z:3) instance of [BoxGeometry()](http://threejs.org/docs/#Reference/Extras.Geometries/BoxGeometry) as boxGeometry. The coordinates are relative to THREE's built in cartesian system, and you can treat as just arbitrary units for the time being. Their relationship to actual pixel size on the screen isn't important right now. Just assume a 3x3x3 cube will be large enough to be visible, but not so large so as to take up the entire environment space.
    
Next we need to tell THREE what kind of material we want our new box to use when we render it. Just like with THREE's geometries, there are a plethora of available materials to choose from. The simplest possible one in our context is a [MeshBasicMaterial()](http://threejs.org/docs/#Reference/Materials/MeshBasicMaterial). Here's how you construct an instance of one:

    var greenMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

This will give us a MeshBasicMaterial() set to the color green as greenMaterial.

**Note:** You're probably getting excited at this point that you have something almost working, or possibly you've skimmed ahead and figured the rest out, and are staring at a green cube. Resist the temptation to try to add shadows and other effects to your scene right now, since using MeshBasicMaterial() will only allow the most primitive of rendering features, and doesn't support the more advanced, such as reflective surfaces or shadows. We promise we'll get to showing you how to implement those and many other things later! :-)

Now that we have a geometry and a material constructed, we need to get THREE to use them to generate the actual shape we've embodied in these two dependent objects. For this we'll generate a THREE Mesh() like so: 

    var cube = new THREE.Mesh(boxGeometry, greenMaterial);
    
Now we have a THREE Mesh() instantiated as the cube variable. This completes the basics for constructing our cube, but we will need to get the shape into the viewable environment. For this we need to add it to the scene.

**Note:** Normally, if we were going to play around with the initial position of our object(s), this would be a good place in the initialization routine to set their default state, and initial orientation or global placement in our scene. For the purposes of this example, we're just going to let THREE render our cube from the 0,0,0 origin point in the world coordinate space. THREE will assume that our cube's world origin is already at 0,0,0, and is identical to if we had called:

    cube.position.set(0,0,0);
    
At this point, the script block in our HTML should look identical to:

    <script>
        // Build The LeiaCore Objects
        var leiaDisplayInfo = new LeiaDisplayInfo('https://www.leiainc.com/latest/LeiaCore/config/displayPrototypeSmall.json');
        var leiaHoloScreen  = new LeiaHoloScreen(leiaDisplayInfo);
        var leiaRenderer    = new LeiaRenderer(leiaDisplayInfo, leiaHoloScreen);
        var scene = new THREE.Scene();
        
        // Connect LeiaRenderer To The Page
        document.body.appendChild(leiaRenderer.renderer.domElement);
        
        // Generate A Cube
        var boxGeometry = new THREE.BoxGeometry(3, 3, 3);
        var greenMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var cube = new THREE.Mesh(boxGeometry, greenMaterial);
    </script>

## Add The Cube To The Scene ##

Now that we've built a simple cube we can add it to the scene we created earlier. It's literally this easy:

    scene.add(cube);

Simple as that! Now that we've constructed our root objects, built a simple shape, added that shape to our scene, lets get it to show up on the screen. This is where we pass our scene and leiaHoloScreen we built in the first part of this example, off to [LeiaRenderer()](https://github.com/LeiaInc/LeiaCore/wiki#leiarenderer) in order to display our visual objects. For this we need to tell the LEIA renderer to render it to our display.

At this point, the script block in our HTML should look identical to:

    <script>
        // Build The LeiaCore Objects
        var leiaDisplayInfo = new LeiaDisplayInfo('https://www.leiainc.com/latest/LeiaCore/config/displayPrototypeSmall.json');
        var leiaHoloScreen  = new LeiaHoloScreen(leiaDisplayInfo);
        var leiaRenderer    = new LeiaRenderer(leiaDisplayInfo, leiaHoloScreen);
        var scene = new THREE.Scene();
        
        // Connect LeiaRenderer To The Page
        document.body.appendChild(leiaRenderer.renderer.domElement);
        
        // Generate A Cube
        var boxGeometry = new THREE.BoxGeometry(3, 3, 3);
        var greenMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var cube = new THREE.Mesh(boxGeometry, greenMaterial);
        
        // Add The Cube To The Scene
        scene.add(cube);
    </script>

## Render The Scene ##

In order to be able to actually see the cube we've just created, we need to tell the LEIA renderer that the scene exists, and to actually draw it to the display. In order to do this we simply call leiaRenderer.render() passing it the scene and the leiaHoloScreen we constructed earlier in the example like so:
    
    leiaRenderer.render(scene, leiaHoloScreen);

The call to LeiaRenderer.render() is static, so you don't need to handle any return value from it.

At this point, the script block in our HTML should look identical to:

    <script>
        // Build The LeiaCore Objects
        var leiaDisplayInfo = new LeiaDisplayInfo('https://www.leiainc.com/latest/LeiaCore/config/displayPrototypeSmall.json');
        var leiaHoloScreen  = new LeiaHoloScreen(leiaDisplayInfo);
        var leiaRenderer    = new LeiaRenderer(leiaDisplayInfo, leiaHoloScreen);
        var scene = new THREE.Scene();
        
        // Connect LeiaRenderer To The Page
        document.body.appendChild(leiaRenderer.renderer.domElement);
        
        // Generate A Cube
        var boxGeometry = new THREE.BoxGeometry(3, 3, 3);
        var greenMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var cube = new THREE.Mesh(boxGeometry, greenMaterial);
        
        // Add The Cube To The Scene
        scene.add(cube);
        
        // Render The Scene
        leiaRenderer.render(scene, leiaHoloScreen);
    </script>
    
## Putting It All Together ##

The [complete HTML file](https://github.com/LeiaInc/LeiaSingleShape/blob/master/index.html) filled in with our new 3D shape, and all of our LEIA rendering code is [available here](https://github.com/LeiaInc/LeiaSingleShape/blob/master/index.html), and should look identical to:

    <!DOCTYPE html>
      <head>
          <meta charset="utf-8">
          <title>Single Shape Demo Example</title>
          <style type="text/css">
          body {
              overflow: hidden;
          }
          </style>
          <script src="https://www.leiainc.com/build/LeiaCore-latest.min.js"></script>
          <script src="https://www.leiainc.com/latest/LeiaCore/js/helvetiker_regular.typeface.js"></script>
          <script src="https://www.leiainc.com/latest/LeiaCore/js/helvetiker_bold.typeface.js"></script>
      </head>
      <body style="margin: 0 0 0 0;"></body>
            <script>
                // Build The LeiaCore Objects
                var leiaDisplayInfo = new LeiaDisplayInfo('https://www.leiainc.com/latest/LeiaCore/config/displayPrototypeSmall.json');
                var leiaHoloScreen  = new LeiaHoloScreen(leiaDisplayInfo);
                var leiaRenderer    = new LeiaRenderer(leiaDisplayInfo, leiaHoloScreen);
                var scene = new THREE.Scene();
                
                // Connect LeiaRenderer To The Page
                document.body.appendChild(leiaRenderer.renderer.domElement);
        
                // Generate A Cube
                var boxGeometry = new THREE.BoxGeometry(3, 3, 3);
                var greenMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
                var cube = new THREE.Mesh(boxGeometry, greenMaterial);
        
                // Add The Cube To The Scene
                scene.add(cube);
        
                // Render The Scene
                leiaRenderer.render(scene, leiaHoloScreen);
            </script>
      </html>

When you are ready for more, lets move on to creating a more complex scene in our [LeiaFourShapeScene](https://github.com/LeiaInc/LeiaFourShapeScene) demo!
