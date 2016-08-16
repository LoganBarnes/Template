
/*

8 888888888o      .8.        8888888 8888888888  
8 8888    `88.   .888.             8 8888        
8 8888     `88  :88888.            8 8888        
8 8888     ,88 . `88888.           8 8888        
8 8888.   ,88'.8. `88888.          8 8888        
8 888888888P'.8`8. `88888.         8 8888        
8 8888      .8' `8. `88888.        8 8888        
8 8888     .8'   `8. `88888.       8 8888        
8 8888    .888888888. `88888.      8 8888        
8 8888   .8'       `8. `88888.     8 8888        
*/


var EditorClass = function (width, height) {

    // camera and mouse functionality
    this.anglePhi = 21;
    this.angleTheta = 25;
    this.zoomZ = 15;

    this.lastMouseX;
    this.lastMouseY;

    this.spaceDown;
    this.moveCamera;
    this.mouseDown;

    this.canvas = document.getElementById("canvas");

    // mouse event listeners
    document.onmouseup = this.handleMouseUp.bind(this);
    document.onmousemove = this.handleMouseMove.bind(this);

    // key event listeners
    document.onkeydown = this.handleKeyDown.bind(this);
    document.onkeyup = this.handleKeyUp.bind(this);

    window.onresize = this.resize.bind(this);

    this.shaderMaterial  = null;
    this.oldModelObject  = null;
    this.modelObject     = null;

    this.rotateCam = false;

    this.showWireframe = false;
    this.showLighting  = true;

    this.currentMaterial = "Sand";
    this.currentModel = "Truck"

    this.models = [ { id: "Building", object: null, file: "res/models/Tie-Fighter/Tie-Fighter.json"   },
                    { id: "Truck",    object: null, file: "res/models/F-150/F-150.json"               }  ];

}


/*

 8 8888   b.             8  8 8888 8888888 8888888888 
 8 8888   888o.          8  8 8888       8 8888       
 8 8888   Y88888o.       8  8 8888       8 8888       
 8 8888   .`Y888888o.    8  8 8888       8 8888       
 8 8888   8o. `Y888888o. 8  8 8888       8 8888       
 8 8888   8`Y8o. `Y88888o8  8 8888       8 8888       
 8 8888   8   `Y8o. `Y8888  8 8888       8 8888       
 8 8888   8      `Y8o. `Y8  8 8888       8 8888       
 8 8888   8         `Y8o.`  8 8888       8 8888       
 8 8888   8            `Yo  8 8888       8 8888       
*/


EditorClass.prototype.setObjectMaterial = function() {

    var editorClass = this;

    this.modelObject.traverse( function ( child )
    {
        if ( child instanceof THREE.Mesh )
            child.material = editorClass.shaderMaterial;
    });

    if (this.oldModelObject !== null) {
        this.scene.remove( this.oldModelObject);
    }
    this.scene.add( this.modelObject );

};



EditorClass.prototype.initThreeJS = function(fovy) {

    // get canvas element
    var canvas = jQuery( "#canvas" );
    renderParams = { canvas: canvas[0] };

    // create and set three js renderer settings
    this.renderer = new THREE.WebGLRenderer( renderParams );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setClearColor( 0x000000, 1 );

    // get the canvas from three js and set appropriate functions
    this.canvas = this.renderer.domElement;
    this.canvas.onmousedown = this.handleMouseDown.bind(this);
    this.canvas.onwheel = this.handleMouseWheel.bind(this);

    // create the camera used for rendering
    this.camera = new THREE.PerspectiveCamera( fovy, 1.0, 0.1, 2000 );

    // create scene and add lighting
    this.scene = new THREE.Scene();

    this.directionalLight = new THREE.DirectionalLight( 0xffffff );
    this.directionalLight.position.set( 1, 1, 1 );
    this.scene.add( this.directionalLight );

    this.updateCamera();
    this.resize();

    this.manager = new THREE.LoadingManager();
    this.manager.onProgress = function ( item, loaded, total ) {
        console.log( item, loaded, total );
    };

    this.loader = new THREE.ObjectLoader( this.manager );

};


EditorClass.prototype.init = function() {

    var fovy = 60.0;
    this.initThreeJS( fovy );


    var editorClass = this;

    // load shader
    loadFiles(["res/shaders/model.vert", "res/shaders/model.frag"], function (shaderText) {

        // create material based on custom shaders
        editorClass.shaderMaterial = new THREE.ShaderMaterial( {

            uniforms: { 
                
                negLightDir: { type: "v3", value: editorClass.directionalLight.position },
                camPos:      { type: "v3", value: editorClass.camera.position },
                lighting:    { type: "i",  value: editorClass.showLighting  }
            },
            vertexShader: shaderText[0],
            fragmentShader: shaderText[1]

        } );

        editorClass.switchModel();

    });

}


EditorClass.prototype.switchModel = function() {

    var model = null;
    var numModels = this.models.length;

    for (var i = 0; i < numModels; ++i ) {

        if (this.models[ i ].id == this.currentModel ) {
            model = this.models[ i ];
            break;
        }
    }

    if (model == null) {
        console.error( "ERROR: No model: " + this.currentModel );
    }

    this.oldModelObject = this.modelObject;

    if ( model.object != null ) {

        this.modelObject = model.object;
        this.setObjectMaterial();
        return;

    }

    var progDiv = $('#progress-div');

    // functions for object loader
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percent = xhr.loaded / xhr.total * 100;
            percent = Math.round(percent, 2);

            progDiv[0].innerHTML = 
            "<div class='progress-bar' role='progressbar' aria-valuenow='" + percent + "'" +
            "aria-valuemin='0' aria-valuemax='100' style='width:" + percent + "%'>" +
            " " + percent + "% </div>";
        }
    };

    var onError = function ( xhr ) {
        console.error( "Bet you wish you took the time to describe when and where this error occurred in the code instead of typing this totally useless message huh?" );
    };

    progDiv[0].innerHTML = 
    "<div class='progress-bar' role='progressbar' aria-valuenow='0'" +
    "aria-valuemin='0' aria-valuemax='100' style='width:0%'>" +
    " 0% </div>";

    progDiv.css('display', 'block');

    var editorClass = this;

    // load model
    this.loader.load( model.file, function ( object ) {

        progDiv.css('display', 'none');

        editorClass.modelObject = object;

        model.object            = object;

        editorClass.setObjectMaterial();

    }, onProgress, onError );
};


EditorClass.prototype.setConstants = function( ) {

    if ( this.shaderMaterial === undefined )
        return;

    if ( this.currentMaterial == "Sand" ) {
    } else if ( this.currentMaterial == "Grass" ) {
    } else if ( this.currentMaterial == "Mud" ) {
    }

};


/*

 8 8888  b.             8  8 888888888o   8 8888      88 8888888 8888888888 
 8 8888  888o.          8  8 8888    `88. 8 8888      88       8 8888       
 8 8888  Y88888o.       8  8 8888     `88 8 8888      88       8 8888       
 8 8888  .`Y888888o.    8  8 8888     ,88 8 8888      88       8 8888       
 8 8888  8o. `Y888888o. 8  8 8888.   ,88' 8 8888      88       8 8888       
 8 8888  8`Y8o. `Y88888o8  8 888888888P'  8 8888      88       8 8888       
 8 8888  8   `Y8o. `Y8888  8 8888         8 8888      88       8 8888       
 8 8888  8      `Y8o. `Y8  8 8888         ` 8888     ,8P       8 8888       
 8 8888  8         `Y8o.`  8 8888           8888   ,d8P        8 8888       
 8 8888  8            `Yo  8 8888            `Y88888P'         8 8888       
*/


/*
 * Mouse Events
 */

EditorClass.prototype.handleMouseDown = function(mouseEvent) {
    this.mouseDown = true;
    var pos = this.getMousePos(mouseEvent);
    this.lastMouseX = pos.x;
    this.lastMouseY = pos.y;
}

EditorClass.prototype.handleMouseUp = function(mouseEvent) {
    this.mouseDown = false;
}

EditorClass.prototype.handleMouseWheel = function(mouseEvent) {
    mouseEvent.preventDefault(); // no page scrolling when using the canvas

    if (mouseEvent.deltaMode == 1) {
        this.zoomZ += mouseEvent.deltaX * 0.3;
    } else {
        this.zoomZ += mouseEvent.deltaY * 0.03;
    }
    this.zoomZ = Math.max(0.001, this.zoomZ);

    this.updateCamera();
}

EditorClass.prototype.handleMouseMove = function(mouseEvent) {

    if (!this.mouseDown)
        return;

    var pos = this.getMousePos(mouseEvent);

    // var translation
    var deltaX = pos.x - this.lastMouseX;
    var deltaY = pos.y - this.lastMouseY;

    this.anglePhi   += deltaY * 0.25;
    this.angleTheta -= deltaX * 0.25;
    this.anglePhi = Math.max(-90.0, this.anglePhi);
    this.anglePhi = Math.min( 90.0, this.anglePhi);

    this.lastMouseX = pos.x
    this.lastMouseY = pos.y;

    this.updateCamera();
}

/*
 * Key Events
 */

EditorClass.prototype.handleKeyDown = function(keyEvent) {
    // this.currentlyPressedKeys[keyEvent.keyCode] = true;
    switch(keyEvent.keyCode) {
        // CMD key (MAC)
        case 224: // Firefox
        case 17:  // Opera
        case 91:  // Chrome/Safari (left)
        case 93:  // Chrome/Safari (right)
            break;
        case 16: // shift
            break;
        case 32: // space]
            keyEvent.preventDefault();
            break;
        case 192: // `
            if (this.paused) {
                this.tick();
            }
            break;
        default:
            // console.log(keyEvent.keyCode);
            break;
    }
}

EditorClass.prototype.handleKeyUp = function(keyEvent) {
    // this.currentlyPressedKeys[keyEvent.keyCode] = false;
    switch(keyEvent.keyCode) {
        // CMD key (MAC)
        case 224: // Firefox
        case 17:  // Opera
        case 91:  // Chrome/Safari (left)
        case 93:  // Chrome/Safari (right)
            break;
        case 16: // shift
            break;
        case 32: // space
            this.rotateCam = !this.rotateCam;
            break;
        case 192: // `
            // if (this.paused) {
            //     this.tick();
            // }
            break;
        default:
            // console.log(keyEvent.keyCode);
            break;
    }
}


/*

8 888888888o.   8 8888888888   b.             8 8 888888888o.      8 8888888888   8 888888888o.   
8 8888    `88.  8 8888         888o.          8 8 8888    `^888.   8 8888         8 8888    `88.  
8 8888     `88  8 8888         Y88888o.       8 8 8888        `88. 8 8888         8 8888     `88  
8 8888     ,88  8 8888         .`Y888888o.    8 8 8888         `88 8 8888         8 8888     ,88  
8 8888.   ,88'  8 888888888888 8o. `Y888888o. 8 8 8888          88 8 888888888888 8 8888.   ,88'  
8 888888888P'   8 8888         8`Y8o. `Y88888o8 8 8888          88 8 8888         8 888888888P'   
8 8888`8b       8 8888         8   `Y8o. `Y8888 8 8888         ,88 8 8888         8 8888`8b       
8 8888 `8b.     8 8888         8      `Y8o. `Y8 8 8888        ,88' 8 8888         8 8888 `8b.     
8 8888   `8b.   8 8888         8         `Y8o.` 8 8888    ,o88P'   8 8888         8 8888   `8b.   
8 8888     `88. 8 888888888888 8            `Yo 8 888888888P'      8 888888888888 8 8888     `88. 
*/


EditorClass.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
};


EditorClass.prototype.tick = function() {
    
    requestAnimationFrame(this.tick.bind(this));

    if ( this.rotateCam ) {

        this.angleTheta += 0.2;
        this.anglePhi    = 21.0;
        this.updateCamera();
    }

    this.render();

}


EditorClass.prototype.updateCamera = function() {
    var phi   = degToRad(this.anglePhi);
    var theta = degToRad(this.angleTheta);

    this.camera.position.x = Math.cos(phi) * Math.sin(theta) * this.zoomZ;
    this.camera.position.y = Math.sin(phi) * this.zoomZ;
    this.camera.position.z = Math.cos(phi) * Math.cos(theta) * this.zoomZ;
    this.camera.lookAt( this.scene.position );
}


/*
 * Updates the canvas, viewport, and camera based on the new dimensions.
 */
EditorClass.prototype.resize = function() {
    var width  = window.innerWidth * 0.65;
    var height = width * 9.0 / 16.0;
    
    this.canvas.width  = width;
    this.canvas.height = height;

    this.renderer.setSize( this.canvas.width, this.canvas.height );

    // set this the right way
    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();
}


/*

8 8888      88 8888888 8888888888  8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
` 8888     ,8P       8 8888        8 8888 8 8888         
  8888   ,d8P        8 8888        8 8888 8 8888         
   `Y88888P'         8 8888        8 8888 8 888888888888 
*/

/*
 * Returns the mouse position relative to the canvas
 */
EditorClass.prototype.getMousePos = function(evt) {
    var rect = this.canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function copyMaterial(mat) {

    var material = {
        color: new THREE.Vector3(0.0),
        power: new THREE.Vector3(0.0),
        emitted: new THREE.Vector3(0.0),
        lambertianReflect: new THREE.Vector3(0.0),
        etaPos: mat.etaPos,
        etaNeg: mat.etaNeg
    }

    material.color.copy(mat.color);
    material.power.copy(mat.power);
    material.emitted.copy(mat.emitted);
    material.lambertianReflect.copy(mat.lambertianReflect);

    return material;
}



/*
          .         .                                                          
         ,8.       ,8.                   .8.           8 8888     b.             8 
        ,888.     ,888.                 .888.          8 8888     888o.          8 
       .`8888.   .`8888.               :88888.         8 8888     Y88888o.       8 
      ,8.`8888. ,8.`8888.             . `88888.        8 8888     .`Y888888o.    8 
     ,8'8.`8888,8^8.`8888.           .8. `88888.       8 8888     8o. `Y888888o. 8 
    ,8' `8.`8888' `8.`8888.         .8`8. `88888.      8 8888     8`Y8o. `Y88888o8 
   ,8'   `8.`88'   `8.`8888.       .8' `8. `88888.     8 8888     8   `Y8o. `Y8888 
  ,8'     `8.`'     `8.`8888.     .8'   `8. `88888.    8 8888     8      `Y8o. `Y8 
 ,8'       `8        `8.`8888.   .888888888. `88888.   8 8888     8         `Y8o.` 
,8'         `         `8.`8888. .8'       `8. `88888.  8 8888     8            `Yo 
*/

function main() {
    var width  = window.innerWidth * 0.65;
    var height = width * 9.0 / 16.0;

    var editorClass = new EditorClass(width, height);
    editorClass.init();

    $(function(){
        $(".dropdown-menu").on("click", "li", function(event) {

            var id = event.currentTarget.id;

            // materials
            if (id != this.currentMaterial && 
                    ( id == "Sand"    ||
                      id == "Grass" ||
                      id == "Mud"   ) ) {

                editorClass.currentMaterial = id;

                $("#materialHeader")[0].innerText = id

                editorClass.setConstants();
            }

            if (id != editorClass.currentModel &&
                    ( id == "Truck" || 
                      id == "Building"     ) ) {

                editorClass.currentModel = id;

                $("#modelHeader")[0].innerText = id;

                editorClass.switchModel();

            }

        });
    });

    var wireBox = document.getElementById("wireframe");
    wireBox.onchange = function() {

        editorClass.showWireframe = wireBox.checked;

        if ( editorClass.shaderMaterial !== undefined) {

            editorClass.shaderMaterial.wireframe = editorClass.showWireframe;

        }

    }

    var lightBox = document.getElementById("lighting");
    lightBox.onchange = function() {

        editorClass.showLighting = lightBox.checked;

        if ( editorClass.shaderMaterial !== undefined) {

            editorClass.shaderMaterial.uniforms.lighting.value = editorClass.showLighting;

        }

    }

    editorClass.tick();

}
