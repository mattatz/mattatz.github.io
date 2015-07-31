/**
 * @author mattatz / http://mattatz.github.io
 */

THREE.WatercolorPass = function ( tPaper ) {
    if ( THREE.Watercolor === undefined ) console.error( "THREE.WatercolorPass relies on THREE.Watercolor" );

    var shader = THREE.Watercolor;
    this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

    tPaper.wrapS = tPaper.wrapT = THREE.RepeatWrapping;
    this.uniforms["tPaper"].value = tPaper;

    this.material = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader
    });

    this.enabled = true;
    this.renderToScreen = false;
    this.needsSwap = true;

    this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
    this.scene  = new THREE.Scene();

    this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
    this.scene.add( this.quad );
};

THREE.WatercolorPass.prototype = {

    render: function ( renderer, writeBuffer, readBuffer, delta ) 
    {
        this.uniforms[ "tDiffuse" ].value = readBuffer;
        this.uniforms[ "texel" ].value = new THREE.Vector2(1.0 / readBuffer.width, 1.0 / readBuffer.height);

        this.quad.material = this.material;
        if ( this.renderToScreen ) 
        {
            renderer.render( this.scene, this.camera );
        } else {
            renderer.render( this.scene, this.camera, writeBuffer, false );
        }
    }

};
