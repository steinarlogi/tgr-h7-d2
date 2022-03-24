let canvas;
let program;
let gl;

let mvLoc;
let proLoc;

let texVegg;
let texGolf;

let loc = vec2(0, 0);
let lastMouseX = 0;
let rotation = 0;
let mouseClicked = false;
let margin = 0.2;

let mv;

window.onload = function init() {
    canvas = document.getElementById('gl-canvas');

    gl = WebGLUtils.setupWebGL(canvas);

    if ( !gl ) { alert('WebGL is not available')};

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, 'vertex-shader', 'fragment-shader');

    gl.useProgram(program);

    
    const { coords, texture } = createSpjald();

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(coords), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    let tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texture), gl.STATIC_DRAW);

    let vTexCoord = gl.getAttribLocation(program, 'vTexCoord');
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    // Lesa inn mynstur
    let veggImage = document.getElementById('VeggImage');
    texVegg = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texVegg);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, veggImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

    let golfImage = document.getElementById('GolfImage');
    texGolf = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texGolf);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, golfImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

    proLoc = gl.getUniformLocation(program, 'projection');
    mvLoc = gl.getUniformLocation(program, 'modelview');

    const proj = perspective(50.0, 1.0, 0.2, 100.0);
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    window.addEventListener('keydown', function(e) {
        switch (e.keyCode) {
            case 38: // Up arrow
                loc = add(loc, scale(0.1, vec2(Math.cos(rotation), Math.sin(rotation))));
                // TODO: Bæta við árekstrarvörn.

                if ((loc[0] >= 10*0.5 - margin)) {
                    loc[0] = 10*0.5 - margin;
                } else if (loc[0] < -10*0.5 + margin) {
                    loc[0] = -10*0.5 + margin;
                }

                if (loc[1] < -0.5 + margin) {
                    loc[1] = -0.5 + margin;
                } else if (loc[1] > 0.5 - margin) {
                    loc[1] = 0.5 - margin;
                }
                break;
        }
    });

    canvas.addEventListener('mousedown', function (e) {
        mouseClicked = true;
        lastMouseX = e.offsetX;
    });

    canvas.addEventListener('mousemove', function (e) {
        if (mouseClicked) {
            rotation -= (lastMouseX - e.offsetX) / 100;
            lastMouseX = e.offsetX;
        }
    });

    canvas.addEventListener('mouseup', function (e) {
        mouseClicked = false;
    });

    render();
}

function createSpjald() {
    let points = [];
    let textureCoords = [];

    let vertices = [
        vec4(0.5, 0.5, 0.0, 1.0),
        vec4(-0.5, 0.5, 0.0, 1.0),
        vec4(-0.5, -0.5, 0.0, 1.0),
        vec4(0.5, -0.5, 0.0, 1.0),
    ];

    let texCoords = [
        vec2(50.0, 5.0),
        vec2(0.0, 5.0),
        vec2(0.0, 0.0),
        vec2(50.0, 0.0),
    ];

    let vertexOrder = [0, 1, 2, 2, 3, 0];

    for (let i = 0; i < vertexOrder.length; i++) {
        points.push(vertices[vertexOrder[i]]);
        textureCoords.push(texCoords[vertexOrder[i]]);
    }

    return { coords: points, texture: textureCoords };
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Teikna fyrst veggi

    mv = lookAt(vec3( loc[0], 0.0, loc[1] ), add(vec3(loc[0], 0, loc[1]), vec3(Math.cos(rotation), 0,  Math.sin(rotation))), vec3(0.0, 1.0, 0.0));

    mv = mult(mv, translate(0, 0, -0.5));
    mv = mult(mv, scalem(10, 1, 1));

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

    gl.bindTexture(gl.TEXTURE_2D, texVegg);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    mv = lookAt(vec3( loc[0], 0.0, loc[1] ), add(vec3(loc[0], 0, loc[1]), vec3(Math.cos(rotation), 0,  Math.sin(rotation))), vec3(0.0, 1.0, 0.0));
    
    mv = mult(mv, translate(0, 0, 0.5));
    mv = mult(mv, scalem(10, 1, 1));
    mv = mult(mv, rotateY(180));

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Teikna svo gólf

    mv = lookAt(vec3( loc[0], 0.0, loc[1] ), add(vec3(loc[0], 0, loc[1]), vec3(Math.cos(rotation), 0,  Math.sin(rotation))), vec3(0.0, 1.0, 0.0));

    mv = mult(mv, translate(0, -0.5, 0));
    mv = mult(mv, rotateX(90));
    mv = mult(mv, scalem(10, 1, 1));

    gl.bindTexture(gl.TEXTURE_2D, texGolf);

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}