const frag_functions_default = `
  #define PI 3.141592653589793
  #define TAU 6.283185307179586
	
	float rand(vec2 c){
		return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
	}

	mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
	}

	mat2 scale2d(vec2 _scale){
			return mat2(_scale.x,0.0,
									0.0,_scale.y);
	}

	vec2 tile (vec2 _st, float _zoom) {
			_st *= _zoom;
			return fract(_st);
	}

	//	Classic Perlin 3D Noise 
	//	by Stefan Gustavson

	vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
	vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
	vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

	float cnoise(vec3 P){
		vec3 Pi0 = floor(P); // Integer part for indexing
		vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
		Pi0 = mod(Pi0, 289.0);
		Pi1 = mod(Pi1, 289.0);
		vec3 Pf0 = fract(P); // Fractional part for interpolation
		vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
		vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
		vec4 iy = vec4(Pi0.yy, Pi1.yy);
		vec4 iz0 = Pi0.zzzz;
		vec4 iz1 = Pi1.zzzz;

		vec4 ixy = permute(permute(ix) + iy);
		vec4 ixy0 = permute(ixy + iz0);
		vec4 ixy1 = permute(ixy + iz1);

		vec4 gx0 = ixy0 / 7.0;
		vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
		gx0 = fract(gx0);
		vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
		vec4 sz0 = step(gz0, vec4(0.0));
		gx0 -= sz0 * (step(0.0, gx0) - 0.5);
		gy0 -= sz0 * (step(0.0, gy0) - 0.5);

		vec4 gx1 = ixy1 / 7.0;
		vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
		gx1 = fract(gx1);
		vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
		vec4 sz1 = step(gz1, vec4(0.0));
		gx1 -= sz1 * (step(0.0, gx1) - 0.5);
		gy1 -= sz1 * (step(0.0, gy1) - 0.5);

		vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
		vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
		vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
		vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
		vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
		vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
		vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
		vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

		vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
		g000 *= norm0.x;
		g010 *= norm0.y;
		g100 *= norm0.z;
		g110 *= norm0.w;
		vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
		g001 *= norm1.x;
		g011 *= norm1.y;
		g101 *= norm1.z;
		g111 *= norm1.w;

		float n000 = dot(g000, Pf0);
		float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
		float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
		float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
		float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
		float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
		float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
		float n111 = dot(g111, Pf1);

		vec3 fade_xyz = fade(Pf0);
		vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
		vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
		float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
		return 2.2 * n_xyz;
	}
	
	
float noise(vec2 p, float freq ){
	float unit = 1./freq;
	vec2 ij = floor(p/unit);
	vec2 xy = mod(p,unit)/unit;
	//xy = 3.*xy*xy-2.*xy*xy*xy;
	xy = .5*(1.-cos(PI*xy));
	float a = rand((ij+vec2(0.,0.)));
	float b = rand((ij+vec2(1.,0.)));
	float c = rand((ij+vec2(0.,1.)));
	float d = rand((ij+vec2(1.,1.)));
	float x1 = mix(a, b, xy.x);
	float x2 = mix(c, d, xy.x);
	return mix(x1, x2, xy.y);
}

	
	float pNoise(vec2 p, int res){
		// p+=u_noise_pan;
		float persistance = .5;
		float n = 0.;
		float normK = 0.;
		float f = 4.;
		float amp = 1.;
		int iCount = 0;
		//noprotect
		for (int i = 0; i<50; i++){
			n+=amp*noise(p, f);
			f*=2.;
			normK+=amp;
			amp*=persistance;
			if (iCount == res) break;
			iCount++;
		}
		float nf = n/normK;
		return nf*nf*nf*nf;
	}

	vec2 random2( vec2 p ) {
			return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
	}

`
const vert = `
	precision highp float;
	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;
	attribute vec3 aPosition;
	attribute vec2 aTexCoord;
	varying vec2 vTexCoord;

	void main() {
  		vTexCoord = aTexCoord;
		vec4 positionVec4 = vec4(aPosition, 1.0);
		gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
	}
`;

const frag = `
	precision highp float;

	uniform vec2 u_resolution; 
	uniform float u_time;
	uniform vec3 u_lightDir;
	uniform vec3 u_col;
	
	uniform vec3 u_brushColor;
	uniform float u_brushAlpha;
	uniform float u_brushNoiseScale;
	uniform float u_brushColorVariant;
	uniform float u_aspectRatio;
	uniform float u_brushTimeFactor;
	uniform float u_randomId;
	uniform float u_blurryFactor;
	
	uniform mat3 uNormalMatrix;
	uniform float u_pixelDensity;
	uniform sampler2D u_tex;

	//attributes, in
	varying vec4 var_centerGlPosition;
	varying vec3 var_vertNormal;
	varying vec2 vTexCoord;
	

	${frag_functions_default}

	void main(){
		vec2 st = vTexCoord.xy; 
		st.x/=u_resolution.y/u_resolution.x;
		
		float randomFactor = 0.1;
		float use_u_time = u_brushTimeFactor*u_time+u_randomId;
		float rd1 = rand(st),rd2 = rand(st+50.),rd3 = rand(st+100.);
		float rd5 = rand(st+5000.)*0.1+0.1;
		
		st+=cnoise(vec3(st*2. ,150.+use_u_time ))*randomFactor;
		st.x+=cnoise(vec3(st*200.,150.+use_u_time))*randomFactor*0.1;
		st.y+=cnoise(vec3(st*200.,1500.+use_u_time))*randomFactor*0.1;
	
		vec3 color = u_brushColor; 
		
		float brushMask = 1.-smoothstep(0.3,0.4,distance(vec2(0.5),st));
		float brushMaskHorizontal = 1.-smoothstep(u_aspectRatio/2.,u_aspectRatio/2.+0.1,distance(vec2(0.5,st.y),st));
		
		float noiseMask1 = smoothstep(0.,0.1+u_blurryFactor,0.12+rd5+ rd1*cnoise(vec3(st*50.,1.+use_u_time)  ));
		float noiseMask2 = smoothstep(0.,0.1+u_blurryFactor,0.12+rd5+rd2*cnoise(vec3(st*5.,1.+use_u_time)));
		float noiseMask3 = smoothstep(0.,0.2+u_blurryFactor,0.2+rd5+rd3*cnoise(vec3(st*15.,1.+use_u_time)));
		float noiseMask4 = smoothstep(0.,0.1+u_blurryFactor,0.01+rd5+rd1*cnoise(vec3(st*3.,1.+use_u_time)));
		float noiseMask5 = smoothstep(0.,0.1+u_blurryFactor,0.01+rd5+rd3*cnoise(vec3(st*1.,1.+use_u_time)));
		float noiseMask = noiseMask1*noiseMask2*noiseMask3*noiseMask4*noiseMask5*0.5;
		
		float colorVarientAmp = u_brushColorVariant;
		vec3 colorVarient1 = vec3(
			(0.4+rd1)*cnoise(vec3(st*0.2,use_u_time+500.)),
			(0.4+rd2)*cnoise(vec3(st*0.2,use_u_time+5.)),
			(0.4+rd3)*cnoise(vec3(st*0.2,use_u_time+5000.))
		); 
		//noiseMask*brushMaskHorizontal* u_brushAlpha
		//gl_FragColor = vec4(vTexCoord,0.,0.);
		//gl_FragColor = vec4(u_brushColor*noiseMask*brushMaskHorizontal*0.8,0
		
		float alpha = brushMask*noiseMask*brushMaskHorizontal* u_brushAlpha;
		gl_FragColor = vec4(1.,0.,0.,0.1);
		gl_FragColor= vec4(color
						+colorVarient1*colorVarientAmp ,alpha);
		//gl_FragColor = vec4(vec3(u_brushColorVariant),1.);
		
	}
`




