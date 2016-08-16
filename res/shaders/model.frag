precision highp float;
precision highp int;

uniform vec3 negLightDir;
uniform vec3 camPos;

varying vec3 pos;
varying vec3 norm;

const float PI = 3.141592653539;
const float E  = 2.718281828459;

const float E_inc = 1.361e3; // Watts/m^2 (sun)

uniform bool lighting;


vec3 calcBRDF( in vec3 w_i, in vec3 w_r )
{

    if ( lighting )
    {

        return vec3( max( 0.0, dot( norm, w_i ) ) * 0.8 );

    }
    else
    {

        return vec3( 0.0 );

    }

}

/**
 *
 */
void main( void )
{

    vec3 w_i = normalize( negLightDir );
    vec3 w_r = normalize( camPos - pos );

    vec3 ambient = vec3( 0.2 );
    vec3 L_o = calcBRDF( w_i, w_r ) + ambient;

    gl_FragColor = vec4( L_o, 1.0 );

}
