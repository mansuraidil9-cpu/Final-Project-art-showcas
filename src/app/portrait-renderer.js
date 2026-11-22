const vertexSource = `
  attribute vec4 a_vertex;
  uniform vec2 u_center;
  uniform float u_aspect;
  uniform vec4 u_rotation;
  varying vec3 v_texture;

  void main() {
    vec2 uv = a_vertex.xy;
    float depth = a_vertex.z;
    const float cameraDistance = 2.4;

    // Pre-compensate for the perspective divide to register exactly at rest.
    float restW = 1.0 - depth / cameraDistance;
    vec2 offset = (uv - u_center) * vec2(2.0, -2.0 / u_aspect);
    vec3 point = vec3(offset * restW, depth);
    vec3 pitched = vec3(
      point.x,
      point.y * u_rotation.x - point.z * u_rotation.y,
      point.y * u_rotation.y + point.z * u_rotation.x
    );
    vec3 rotated = vec3(
      pitched.x * u_rotation.z + pitched.z * u_rotation.w,
      pitched.y,
      pitched.z * u_rotation.z - pitched.x * u_rotation.w
    );

    point = mix(point, rotated, a_vertex.w);
    float w = 1.0 - point.z / cameraDistance;
    vec2 center = u_center * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
    gl_Position = vec4(point.xy * vec2(1.0, u_aspect) + center * w, -point.z / cameraDistance, w);

    // Affine interpolation inside these small triangles preserves the original UVs at rest.
    v_texture = vec3(uv * w, w);
  }
`

const fragmentSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform sampler2D u_image;
  varying vec3 v_texture;

  void main() {
    gl_FragColor = texture2D(u_image, v_texture.xy / v_texture.z);
  }
`

const desktopPortrait = {
  center: [0.665, 0.415],
  face: [0.678, 0.321, 0.045, 0.087],
  nose: [0.666, 0.320, 0.012, 0.024],
  brow: [0.670, 0.270, 0.029, 0.018],
  torso: [0.644, 0.538, 0.069, 0.123],
  hands: [0.610, 0.695, 0.036, 0.035],
  depthScale: 1,
}

const mobilePortrait = {
  center: [0.557, 0.764],
  face: [0.567, 0.741, 0.036, 0.041],
  nose: [0.556, 0.744, 0.011, 0.012],
  brow: [0.559, 0.722, 0.026, 0.009],
  torso: [0.539, 0.809, 0.064, 0.046],
  hands: [0.516, 0.852, 0.036, 0.014],
  depthScale: 0.82,
}

function gaussian(x, y, [centerX, centerY, width, height]) {
  const dx = (x - centerX) / width
  const dy = (y - centerY) / height
  return Math.exp(-0.5 * (dx * dx + dy * dy))
}

function createMesh(portrait) {
  const segments = 160
  const rowLength = segments + 1
  const vertices = new Float32Array(rowLength * rowLength * 4)
  const indices = new Uint16Array(segments * segments * 6)
  let vertexOffset = 0
  let indexOffset = 0

  for (let row = 0; row <= segments; row++) {
    const v = row / segments
    for (let column = 0; column <= segments; column++) {
      const u = column / segments
      const face = gaussian(u, v, portrait.face)
      const torso = gaussian(u, v, portrait.torso)
      const hands = gaussian(u, v, portrait.hands)
      const nose = gaussian(u, v, portrait.nose)
      const brow = gaussian(u, v, portrait.brow)
      const depth = portrait.depthScale * (0.060 * face + 0.036 * nose + 0.011 * brow + 0.026 * torso + 0.010 * hands)
      const influence = Math.min(1, 1.5 * face + 0.82 * torso + 0.60 * hands)

      vertices[vertexOffset++] = u
      vertices[vertexOffset++] = v
      vertices[vertexOffset++] = depth
      vertices[vertexOffset++] = influence

      if (row < segments && column < segments) {
        const top = row * rowLength + column
        const bottom = top + rowLength
        indices[indexOffset++] = top
        indices[indexOffset++] = bottom
        indices[indexOffset++] = top + 1
        indices[indexOffset++] = top + 1
        indices[indexOffset++] = bottom
        indices[indexOffset++] = bottom + 1
      }
    }
  }

  return { vertices, indices }
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader

  gl.deleteShader(shader)
  return null
}

export function createPortraitRenderer(canvas, image, mobile) {
  if (!image.naturalWidth || !image.naturalHeight) return null

  let gl
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false })
  } catch {
    return null
  }
  if (!gl) return null

  const program = gl.createProgram()
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const vertexBuffer = gl.createBuffer()
  const indexBuffer = gl.createBuffer()
  const texture = gl.createTexture()
  let disposed = false

  function dispose() {
    if (disposed) return
    disposed = true
    gl.useProgram(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.deleteProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    gl.deleteBuffer(vertexBuffer)
    gl.deleteBuffer(indexBuffer)
    gl.deleteTexture(texture)
  }

  if (!program || !vertexShader || !fragmentShader || !vertexBuffer || !indexBuffer || !texture) {
    dispose()
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose()
    return null
  }

  gl.useProgram(program)
  const portrait = mobile ? mobilePortrait : desktopPortrait
  const { vertices, indices } = createMesh(portrait)
  const vertexLocation = gl.getAttribLocation(program, 'a_vertex')
  const aspectLocation = gl.getUniformLocation(program, 'u_aspect')
  const rotationLocation = gl.getUniformLocation(program, 'u_rotation')

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(vertexLocation)
  gl.vertexAttribPointer(vertexLocation, 4, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)

  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  } catch {
    dispose()
    return null
  }
  if (gl.getError() !== gl.NO_ERROR) {
    dispose()
    return null
  }

  gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0)
  gl.uniform2f(gl.getUniformLocation(program, 'u_center'), ...portrait.center)
  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0, 0, 0, 0)

  function draw(pitch, yaw) {
    const { width, height } = canvas
    if (disposed || !width || !height || gl.isContextLost()) return

    gl.viewport(0, 0, width, height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.uniform1f(aspectLocation, width / height)
    gl.uniform4f(rotationLocation, Math.cos(pitch), Math.sin(pitch), Math.cos(yaw), Math.sin(yaw))
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
  }

  return { draw, dispose }
}
