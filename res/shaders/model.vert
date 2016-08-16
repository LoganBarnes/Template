precision highp float;
precision highp int;

varying vec3 pos;
varying vec3 norm;

void main(void) {

	// world space vertex
	pos = vec3( modelMatrix * vec4( position, 1.0 ) );

	// world space normal
	norm = normalize( normalMatrix * normal );

	// screen space
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}