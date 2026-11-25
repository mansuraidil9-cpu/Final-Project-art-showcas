'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, value) => {
  const t = clamp((value - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const mixVector = (from, to, amount) => from.clone().lerp(to, amount)

function cacheArtworkOpacity(group) {
  group.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.filter(Boolean).forEach(material => {
      material.userData.studioBaseOpacity ??= material.opacity
      material.userData.studioBaseTransparent ??= material.transparent
      material.userData.studioBaseDepthWrite ??= material.depthWrite
    })
  })
}

function setArtworkOpacity(group, opacity) {
  const alpha = clamp(opacity, 0, 1)
  group.visible = alpha > .01
  group.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.filter(Boolean).forEach(material => {
      const transparent = material.userData.studioBaseTransparent || alpha < .999
      if (material.transparent !== transparent) {
        material.transparent = transparent
        material.needsUpdate = true
      }
      material.opacity = material.userData.studioBaseOpacity * alpha
      material.depthWrite = alpha < .999 ? false : material.userData.studioBaseDepthWrite
    })
  })
}

function getLayout() {
  const { innerWidth: width, innerHeight: height } = window
  const compactLandscape = width > height && height <= 560
  if (width < 768 && !compactLandscape) {
    return { heroX:.16, heroY:-1, heroScale:.65, dimX:0, dimY:1.03, dimScale:.57, galleryX:.15, galleryY:.72, galleryScale:.64, finaleScale:.73, finaleEdge:2.7, baseZ:9.8 }
  }
  if (width < 1024) {
    return { heroX:1.25, heroY:-.12, heroScale:.81, dimX:-1.4, dimY:.08, dimScale:.77, galleryX:1.34, galleryY:.08, galleryScale:.81, finaleScale:.83, finaleEdge:3.8, baseZ:8.9 }
  }
  return { heroX:1.88, heroY:0, heroScale:1.01, dimX:-1.88, dimY:.04, dimScale:.94, galleryX:1.60, galleryY:.04, galleryScale:.96, finaleScale:1.02, finaleEdge:5.15, baseZ:8.2 }
}

export default function StudioScene({ images = [], labels = [], heroImage, motionRef, onSelectArtwork, onReady, onFailed }) {
  const mountRef = useRef(null)
  const sourcesKey = images.join('|')
  const labelsKey = labels.join('|')

  useEffect(() => {
    const sceneLabels = labelsKey.split('|')
    const mount = mountRef.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!mount || reduce.matches) { onFailed(); return }

    let renderer
    let raf = 0
    let disposed = false
    let gesture = null
    let stageActive = motionRef.current.studioVisible !== false
    let hero
    let gallery = []
    let particles
    let scene
    let artworkRoot
    let camera
    let light
    let brush
    let ribbon
    let canvas
    let border
    let backing
    let varnish
    let details
    let guideLines
    let architecture
    let floor
    let floorMaterial
    let paintDrops = []
    let goldLeaves = []
    const renderTargets = new Set()
    const ownedGeometries = new Set()
    const ownedMaterials = new Set()
    const ownedTextures = new Set()
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')

    const makeGeometry = geometry => { ownedGeometries.add(geometry); return geometry }
    const makeMaterial = material => { ownedMaterials.add(material); return material }
    function addBox(parent, x, y, z, w, h, d, material) {
      const mesh = new THREE.Mesh(makeGeometry(new THREE.BoxGeometry(w,h,d)), material)
      mesh.position.set(x,y,z)
      parent.add(mesh)
      return mesh
    }
    function loadImage(url, material, frameAspect) {
      if (!url) return
      try {
        const texture = loader.load(url, loaded => {
          if (disposed) { loaded.dispose(); return }
          loaded.colorSpace = THREE.SRGBColorSpace
          loaded.needsUpdate = true
          loaded.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 16)
          // Isi bidang lukisan tanpa meregangkan rasio gambar asli.
          const imageWidth = loaded.image?.naturalWidth || loaded.image?.width || 1
          const imageHeight = loaded.image?.naturalHeight || loaded.image?.height || 1
          const imageAspect = imageWidth / imageHeight
          if (frameAspect && Number.isFinite(imageAspect) && imageAspect > 0) {
            loaded.center.set(.5,.5)
            if (imageAspect > frameAspect) {
              loaded.repeat.set(frameAspect / imageAspect,1)
            } else {
              loaded.repeat.set(1,imageAspect / frameAspect)
            }
          }
          material.map = loaded
          material.color.set('#ffffff')
          material.needsUpdate = true
        }, undefined, () => {
          if (disposed) return
          material.map = null
          material.color.set('#bda787')
          material.needsUpdate = true
        })
        ownedTextures.add(texture)
      } catch {
        material.color.set('#bda787')
      }
    }
    // Tekstur serat kayu ringan, dibuat sekali di browser agar bingkai memiliki
    // detail visual tanpa menambah permintaan aset atau membebani data karya.
    function createWoodTexture() {
      const surface = document.createElement('canvas')
      surface.width = 256
      surface.height = 512
      const context = surface.getContext('2d')
      if (!context) return null
      context.fillStyle = '#805234'
      context.fillRect(0,0,256,512)
      for (let i=0; i<200; i++) {
        const x=(i*37.7) % 256
        const shift=Math.sin(i*7.3)*11
        context.beginPath()
        context.moveTo(x,-12)
        context.bezierCurveTo(x+shift,125,x-shift*.7,375,x+shift*.25,524)
        context.strokeStyle=i%3===0?'rgba(39,23,14,.13)':'rgba(228,166,108,.085)'
        context.lineWidth=.3+(i%5)*.22
        context.stroke()
      }
      const texture = new THREE.CanvasTexture(surface)
      texture.colorSpace=THREE.SRGBColorSpace
      texture.wrapS=THREE.RepeatWrapping
      texture.wrapT=THREE.RepeatWrapping
      ownedTextures.add(texture)
      return texture
    }
    const woodGrain = createWoodTexture()

    // Bentuk cincin tunggal mencegah ujung batang menonjol di sudut.
    function addBeveledRing(parent,width,height,inset,thickness,z,material,bevel) {
      const iw = width - inset*2, ih = height - inset*2
      const ow = iw + thickness*2, oh = ih + thickness*2
      const shape = new THREE.Shape()
      shape.moveTo(-ow/2,-oh/2)
      shape.lineTo(ow/2,-oh/2)
      shape.lineTo(ow/2,oh/2)
      shape.lineTo(-ow/2,oh/2)
      shape.closePath()
      const cutout = new THREE.Path()
      cutout.moveTo(-iw/2,-ih/2)
      cutout.lineTo(-iw/2,ih/2)
      cutout.lineTo(iw/2,ih/2)
      cutout.lineTo(iw/2,-ih/2)
      cutout.closePath()
      shape.holes.push(cutout)
      const geometry = makeGeometry(new THREE.ExtrudeGeometry(shape,{
        depth:.105,steps:1,bevelEnabled:true,
        bevelThickness:bevel*.55,bevelSize:bevel,bevelSegments:3,
      }))
      const mesh = new THREE.Mesh(geometry,material)
      mesh.position.z=z
      parent.add(mesh)
      return mesh
    }

    function artworkFrame(url, width=2.75, height=3.45, plaqueLabel='') {
      const group = new THREE.Group()
      const rim = new THREE.Group()
      const backing = new THREE.Group()
      group.add(rim,backing)
      const walnut=makeMaterial(new THREE.MeshStandardMaterial({
        color:woodGrain ? 0xffffff : 0x805234,map:woodGrain || null,roughness:.52,metalness:0,
      }))
      const darkWood=makeMaterial(new THREE.MeshStandardMaterial({
        color:0x392419,roughness:.61,metalness:.02,
      }))
      const gold=makeMaterial(new THREE.MeshStandardMaterial({
        color:0xb3894c,roughness:.3,metalness:.62,
      }))
      const canvasBacking=makeMaterial(new THREE.MeshStandardMaterial({
        color:0x241c17,roughness:.83,
      }))
      // Lukisan mempertahankan piksel aslinya, tanpa bayangan berlebihan.
      const imageMaterial=makeMaterial(new THREE.MeshBasicMaterial({
        color:0xffffff,side:THREE.DoubleSide,toneMapped:false,transparent:false,opacity:1,
      }))
      addBeveledRing(rim,width,height,0,.18,-.075,walnut,.018)
      addBeveledRing(rim,width,height,.045,.082,.045,darkWood,.012)
      addBeveledRing(rim,width,height,.115,.032,.145,gold,.006)
      addBox(backing,0,0,-.14,width+.06,height+.06,.15,canvasBacking)
      const plane = new THREE.Mesh(
        makeGeometry(new THREE.PlaneGeometry(width-.025,height-.025)),
        imageMaterial,
      )
      plane.position.z=.105
      group.add(plane)
      loadImage(url,imageMaterial,width/height)
      if (plaqueLabel) {
        const plaqueWidth=Math.min(1.55,width*.72)
        const plaque= new THREE.Mesh(makeGeometry(new THREE.BoxGeometry(plaqueWidth,.16,.055)),gold)
        plaque.position.set(0,-height/2-.145,.12)
        group.add(plaque)
        const plaqueCanvas=document.createElement('canvas')
        plaqueCanvas.width=512
        plaqueCanvas.height=72
        const plaqueContext=plaqueCanvas.getContext('2d')
        if (plaqueContext) {
          plaqueContext.fillStyle='#9d7842'
          plaqueContext.fillRect(0,0,512,72)
          plaqueContext.fillStyle='#f6e7c9'
          plaqueContext.font='500 25px Georgia, serif'
          plaqueContext.textAlign='center'
          plaqueContext.textBaseline='middle'
          plaqueContext.fillText(String(plaqueLabel).slice(0,52),256,37,486)
          const plaqueTexture=new THREE.CanvasTexture(plaqueCanvas)
          plaqueTexture.colorSpace=THREE.SRGBColorSpace
          ownedTextures.add(plaqueTexture)
          const plaqueMaterial=makeMaterial(new THREE.MeshBasicMaterial({ map:plaqueTexture,toneMapped:false }))
          const plaqueFace=new THREE.Mesh(makeGeometry(new THREE.PlaneGeometry(plaqueWidth-.08,.11)),plaqueMaterial)
          plaqueFace.position.set(0,-height/2-.145,.151)
          group.add(plaqueFace)
        }
      }
      return {group,plane,rim,backing,width,height}
    }
    function paintStroke(controlPoints, shades) {
      const curve = new THREE.CatmullRomCurve3(controlPoints.map(point => new THREE.Vector3(...point)))
      const positions = []
      const colors = []
      const indices = []
      const count = 64
      for (let index = 0; index <= count; index++) {
        const t = index / count
        const point = curve.getPoint(t)
        const tangent = curve.getTangent(t)
        const sideways = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize()
        const breadth = (.20 + .048 * Math.sin(t * 21)) * Math.pow(Math.sin(Math.PI * t), .7)
        const shadeIndex = Math.min(Math.floor(t * (shades.length - 1)), shades.length - 2)
        const blend = t * (shades.length - 1) - shadeIndex
        const tone = new THREE.Color(shades[shadeIndex]).lerp(new THREE.Color(shades[shadeIndex + 1]), blend)
        for (const sign of [-1, 1]) {
          const side = sideways.clone().multiplyScalar(sign * breadth)
          positions.push(point.x + side.x, point.y + side.y, point.z + sign * .014)
          colors.push(tone.r, tone.g, tone.b)
        }
        if (index < count) {
          const k = index * 2
          indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2)
        }
      }
      const geometry = makeGeometry(new THREE.BufferGeometry())
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      geometry.setIndex(indices)
      geometry.computeVertexNormals()
      return new THREE.Mesh(geometry, makeMaterial(new THREE.MeshPhysicalMaterial({
        vertexColors: true, side: THREE.DoubleSide, roughness: .24, metalness: .08,
        clearcoat: 1, clearcoatRoughness: .16, envMapIntensity: .9,
      })))
    }

    function addHeroBackDetails(part) {
      const { group,backing:backLayer,width,height } = part
      const timber = makeMaterial(new THREE.MeshStandardMaterial({
        color:woodGrain ? 0xffffff : 0x805234,map:woodGrain || null,roughness:.58,
      }))
      const brass = makeMaterial(new THREE.MeshPhysicalMaterial({
        color:0x9d7842,metalness:.78,roughness:.26,clearcoat:.72,clearcoatRoughness:.2,
      }))
      addBox(backLayer,0,height*.42,-.255,width-.34,.09,.055,timber)
      addBox(backLayer,0,-height*.42,-.255,width-.34,.09,.055,timber)
      addBox(backLayer,-width*.43,0,-.255,.09,height-.3,.055,timber)
      addBox(backLayer,width*.43,0,-.255,.09,height-.3,.055,timber)
      addBox(backLayer,0,-height*.39,-.325,1.5,.23,.075,brass)

      const labelCanvas = document.createElement('canvas')
      labelCanvas.width = 512
      labelCanvas.height = 88
      const labelContext = labelCanvas.getContext('2d')
      if (labelContext) {
        labelContext.fillStyle = '#9d7842'
        labelContext.fillRect(0,0,labelCanvas.width,labelCanvas.height)
        labelContext.fillStyle = '#f6e7c9'
        labelContext.font = '600 30px Georgia, serif'
        labelContext.textAlign = 'center'
        labelContext.textBaseline = 'middle'
        labelContext.fillText('ALTERIA · ARSIP UTAMA',256,45)
        const labelTexture = new THREE.CanvasTexture(labelCanvas)
        labelTexture.colorSpace = THREE.SRGBColorSpace
        ownedTextures.add(labelTexture)
        const labelMaterial = makeMaterial(new THREE.MeshBasicMaterial({
          map:labelTexture,side:THREE.DoubleSide,toneMapped:false,
        }))
        const label = new THREE.Mesh(makeGeometry(new THREE.PlaneGeometry(1.42,.19)),labelMaterial)
        label.position.set(0,-height*.39,-.367)
        label.rotation.y = Math.PI
        backLayer.add(label)
      }
    }

    function createTravertineTexture() {
      const surface = document.createElement('canvas')
      surface.width = 512
      surface.height = 512
      const context = surface.getContext('2d')
      if (!context) return null
      context.fillStyle = '#d9cfbd'
      context.fillRect(0,0,512,512)
      for (let i=0;i<74;i++) {
        const y=(i*31.7)%512
        context.beginPath()
        context.moveTo(0,y)
        context.bezierCurveTo(130,y+Math.sin(i)*8,350,y-Math.cos(i*2)*7,512,y+Math.sin(i*3)*5)
        context.strokeStyle=i%4===0?'rgba(143,120,89,.12)':'rgba(255,250,238,.11)'
        context.lineWidth=i%7===0?2:.7
        context.stroke()
      }
      const texture = new THREE.CanvasTexture(surface)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(5,7)
      ownedTextures.add(texture)
      return texture
    }

    function createGalleryArchitecture() {
      architecture = new THREE.Group()
      const wall = new THREE.Mesh(
        makeGeometry(new THREE.PlaneGeometry(80,28)),
        makeMaterial(new THREE.MeshBasicMaterial({ color:0xe4d9c8,transparent:true,opacity:.24,depthWrite:false })),
      )
      wall.position.set(0,2,-16)
      architecture.add(wall)

      const stone = makeMaterial(new THREE.MeshStandardMaterial({ color:0xcbbba7,roughness:.92,metalness:0,transparent:true,opacity:.22,envMapIntensity:.25 }))
      const recess = makeMaterial(new THREE.MeshBasicMaterial({ color:0xb8a589,transparent:true,opacity:.12,depthWrite:false }))
      for (let i=0;i<9;i++) {
        const alcove = new THREE.Group()
        alcove.position.set((i-4)*3.75,0,-13.7)
        const panel = new THREE.Mesh(makeGeometry(new THREE.PlaneGeometry(2.7,3.75)),recess)
        panel.position.set(0,.15,-.08)
        alcove.add(panel)
        const arch = new THREE.Mesh(makeGeometry(new THREE.TorusGeometry(1.43,.075,8,36,Math.PI)),stone)
        arch.position.set(0,1.12,0)
        alcove.add(arch)
        for (const side of [-1,1]) {
          const pilaster = new THREE.Mesh(makeGeometry(new THREE.CylinderGeometry(.105,.135,3.85,10)),stone)
          pilaster.position.set(side*1.43,-.82,0)
          alcove.add(pilaster)
          for (const flute of [-.052,0,.052]) {
            const line = new THREE.Mesh(makeGeometry(new THREE.CylinderGeometry(.009,.009,3.5,5)),recess)
            line.position.set(side*1.43+flute,-.82,.108)
            alcove.add(line)
          }
          addBox(alcove,side*1.43,-2.8,.03,.37,.14,.24,stone)
          addBox(alcove,side*1.43,1.12,.03,.37,.13,.24,stone)
        }
        architecture.add(alcove)
      }

      const beamMaterial = makeMaterial(new THREE.MeshBasicMaterial({
        color:0xffefcf,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide,
      }))
      for (const x of [-4.2,0,4.2]) {
        const beam = new THREE.Mesh(makeGeometry(new THREE.ConeGeometry(1.55,8,28,1,true)),beamMaterial)
        beam.position.set(x,4,-7)
        beam.rotation.z=x*.006
        architecture.add(beam)
      }
      scene.add(architecture)

      const floorMap = createTravertineTexture()
      floorMaterial = makeMaterial(new THREE.MeshPhysicalMaterial({
        color:0xe8dfd0,map:floorMap,roughness:.34,metalness:.03,clearcoat:.18,
        transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:.42,
      }))
      floor = new THREE.Mesh(makeGeometry(new THREE.PlaneGeometry(80,48)),floorMaterial)
      floor.rotation.x=-Math.PI/2+.24
      floor.position.set(0,-3.35,-5)
      scene.add(floor)

      const leafShape = new THREE.Shape()
      leafShape.moveTo(0,.16)
      leafShape.bezierCurveTo(.2,.08,.2,-.08,0,-.16)
      leafShape.bezierCurveTo(-.2,-.08,-.2,.08,0,.16)
      const leafGeometry = makeGeometry(new THREE.ExtrudeGeometry(leafShape,{ depth:.012,bevelEnabled:true,bevelSegments:1,bevelSize:.012,bevelThickness:.006,steps:1 }))
      const leafMaterial = makeMaterial(new THREE.MeshPhysicalMaterial({
        color:0xb88a44,metalness:.82,roughness:.24,clearcoat:.9,clearcoatRoughness:.18,side:THREE.DoubleSide,
      }))
      for (let i=0;i<17;i++) {
        const leaf = new THREE.Mesh(leafGeometry,leafMaterial)
        leaf.position.set(1.25+(i*1.73%4.8),Math.cos(i*4.17)*2.35-0.2, -2.4-(i%6)*1.05)
        leaf.rotation.set(i*.37,i*.71,i*1.19)
        leaf.userData.phase=i*1.37
        leaf.userData.baseX=leaf.position.x
        leaf.userData.baseY=leaf.position.y
        goldLeaves.push(leaf)
        architecture.add(leaf)
      }
    }

    function cleanup() {
      if (disposed) return
      disposed = true
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', visibilityChange)
      window.removeEventListener('resize', resize)
      window.removeEventListener('alteria-studio-visibility', studioVisibilityChange)
      reduce.removeEventListener('change', preferenceChange)
      if (renderer) {
        renderer.domElement.removeEventListener('pointerdown', pointerDown)
        renderer.domElement.removeEventListener('pointermove', pointerMove)
        renderer.domElement.removeEventListener('pointerup', pointerUp)
        renderer.domElement.removeEventListener('pointercancel', pointerCancel)
      }
      ownedGeometries.forEach(geometry => geometry.dispose())
      ownedMaterials.forEach(material => material.dispose())
      ownedTextures.forEach(texture => texture.dispose())
      renderTargets.forEach(target => target.dispose())
      if (renderer) {
        renderer.renderLists.dispose()
        renderer.dispose()
        renderer.forceContextLoss()
        renderer.domElement.remove()
      }
    }
    function pointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const isManual = motionRef.current.manual
      const progress = motionRef.current.progress
      if (!isManual && (progress < .52 || progress > .88 || gallery.length < 2)) return
      gesture = {
        id: event.pointerId, startX: event.clientX, startY: event.clientY,
        lastX: event.clientX, lastY: event.clientY, manual: isManual,
      }
      try { renderer.domElement.setPointerCapture(event.pointerId) } catch {}
    }
    function pointerMove(event) {
      if (!gesture || event.pointerId !== gesture.id) return
      if (gesture.manual) {
        motionRef.current.orbitY = clamp(motionRef.current.orbitY + (event.clientX - gesture.lastX) * .004, -1.25, 1.25)
        motionRef.current.orbitX = clamp(motionRef.current.orbitX + (event.clientY - gesture.lastY) * .003, -.7, .7)
        gesture.lastX = event.clientX
        gesture.lastY = event.clientY
      } else {
        const dx = event.clientX - gesture.startX
        const dy = event.clientY - gesture.startY
        if (Math.abs(dx) > Math.abs(dy)) {
          motionRef.current.dragOffset = clamp(dx / Math.max(innerWidth * .38, 260), -1, 1)
        }
      }
    }
    function pointerUp(event) {
      if (!gesture || event.pointerId !== gesture.id) return
      const last = gesture
      gesture = null
      motionRef.current.dragOffset = 0
      if (last.manual) return
      const dx = event.clientX - last.startX
      const dy = event.clientY - last.startY
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        const selected = motionRef.current.galleryIndex || 0
        onSelectArtwork(clamp(selected + (dx < 0 ? 1 : -1), 0, gallery.length - 1))
        return
      }
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(gallery.filter(group => group.visible), true)
      for (const hit of hits) {
        const index = gallery.findIndex(group => {
          let current = hit.object
          while (current) {
            if (current === group) return true
            current = current.parent
          }
          return false
        })
        if (index !== -1) {
          onSelectArtwork(index)
          break
        }
      }
    }
    function pointerCancel() {
      gesture = null
      motionRef.current.dragOffset = 0
    }
    function resize() {
      if (!renderer || !camera) return
      const width = mount.clientWidth || innerWidth
      const height = mount.clientHeight || innerHeight
      camera.aspect = width / Math.max(height,1)
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
      renderer.setSize(width,height,false)
    }
    function visibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!disposed && !reduce.matches && stageActive && !raf) raf = requestAnimationFrame(draw)
    }
    function preferenceChange() {
      if (reduce.matches) {
        cancelAnimationFrame(raf); raf = 0
        if (renderer) renderer.domElement.style.opacity = '0'
        onFailed()
      } else if (!disposed) {
        if (renderer) renderer.domElement.style.opacity = '1'
        onReady()
        if (stageActive && !raf) raf = requestAnimationFrame(draw)
      }
    }
    function studioVisibilityChange(event) {
      stageActive = event.detail !== false
      if (!stageActive) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!disposed && !reduce.matches && !document.hidden && !raf) {
        raf = requestAnimationFrame(draw)
      }
    }

    try {
      scene = new THREE.Scene()
      artworkRoot = new THREE.Group()
      artworkRoot.position.set(0,0,0)
      scene.add(artworkRoot)
      camera = new THREE.PerspectiveCamera(38,innerWidth / innerHeight,.1,110)
      camera.position.z = 8.2
      renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' })
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.08
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.setClearColor(0xffffff,0)
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y'
      mount.appendChild(renderer.domElement)
      resize()

      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      const roomEnvironment = new RoomEnvironment()
      try {
        const environmentTarget = pmremGenerator.fromScene(roomEnvironment,.04)
        renderTargets.add(environmentTarget)
        scene.environment = environmentTarget.texture
        scene.environmentIntensity = .42
      } finally {
        roomEnvironment.dispose()
        pmremGenerator.dispose()
      }

      const hemi = new THREE.HemisphereLight(0xfff6e8,0x7a5c3d,.92)
      scene.add(hemi)
      const key = new THREE.DirectionalLight(0xffebd0,1.55)
      key.position.set(-5.5,6.2,7.5)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xf7e4c8,.72)
      fill.position.set(6,2,5.5)
      scene.add(fill)
      const rim = new THREE.DirectionalLight(0xe0a95b,.9)
      rim.position.set(3.2,-3.8,-4.5)
      scene.add(rim)
      const softFront = new THREE.HemisphereLight(0xfffaf0,0xc0aa8f,.7)
      scene.add(softFront)
      const frontFill = new THREE.DirectionalLight(0xfff7ed,1.15)
      frontFill.position.set(0,2.2,9)
      scene.add(frontFill)
      light = new THREE.PointLight(0xffdfb0,.65,16)
      light.position.set(2,1,5)
      scene.add(light)

      createGalleryArchitecture()

      const heroPart = artworkFrame(heroImage, 2.50, 3.72)
      hero = heroPart.group
      canvas = heroPart.plane
      border = heroPart.rim
      backing = heroPart.backing
      artworkRoot.add(hero)
      addHeroBackDetails(heroPart)

      varnish = new THREE.Mesh(
        makeGeometry(new THREE.PlaneGeometry(2.42,3.66)),
        makeMaterial(new THREE.MeshPhysicalMaterial({
          color:0xffffff,transparent:true,opacity:.12,roughness:.12,metalness:.05,
          clearcoat:1,clearcoatRoughness:.08,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:.8,
        })),
      )
      varnish.position.z=.13
      hero.add(varnish)

      const guideGeometry = new THREE.BufferGeometry()
      const guidePoints = []
      for (const x of [-1.39,1.39]) for (const y of [-2.02,2.02]) {
        guidePoints.push(new THREE.Vector3(x,y,-.45),new THREE.Vector3(x,y,.86))
      }
      guideGeometry.setFromPoints(guidePoints)
      makeGeometry(guideGeometry)
      guideLines = new THREE.LineSegments(guideGeometry,makeMaterial(new THREE.LineBasicMaterial({
        color:0xb08d57,transparent:true,opacity:.42,depthWrite:false,
      })))
      guideLines.visible=false
      hero.add(guideLines)

      details = new THREE.Group()
      hero.add(details)
      ribbon = new THREE.Group()
      // Aliran warna berada di luar bidang wajah dan rel navigasi.
      ribbon.add(paintStroke([
        [1.48,-1.44,.39],[1.73,-1.0,.52],[1.93,-.49,.64],
        [1.82,.06,.60],[1.96,.48,.53],
      ], ['#576846','#A36C42','#C68C54','#E1B77A']))
      ribbon.add(paintStroke([
        [1.55,-1.59,.41],[1.9,-1.24,.52],[1.79,-.70,.66],
        [1.99,-.12,.59],[2.08,.19,.51],
      ], ['#7A4930','#A8623C','#BE925E','#586948']))
      details.add(ribbon)

      brush = new THREE.Group()
      const handleMat = makeMaterial(new THREE.MeshPhysicalMaterial({ color:0x614124, roughness:.58, clearcoat:.35, clearcoatRoughness:.35 }))
      const metalMat = makeMaterial(new THREE.MeshPhysicalMaterial({ color:0x9b7650, metalness:.72, roughness:.28, clearcoat:.8 }))
      const tipMat = makeMaterial(new THREE.MeshStandardMaterial({ color:0x443525, roughness:1 }))
      brush.add(new THREE.Mesh(makeGeometry(new THREE.CylinderGeometry(.045,.065,1.7,10)),handleMat))
      const ferrule = new THREE.Mesh(makeGeometry(new THREE.CylinderGeometry(.075,.068,.25,10)),metalMat)
      ferrule.position.y=.9
      brush.add(ferrule)
      const tip = new THREE.Mesh(makeGeometry(new THREE.ConeGeometry(.072,.36,12)),tipMat)
      tip.position.y=1.2
      brush.add(tip)
      brush.scale.setScalar(.68)
      brush.position.set(1.64,-1.07,.62)
      brush.rotation.set(.18,-.22,-.46)
      details.add(brush)

      const paintColors = [0xB56C40,0x637451,0xD4A467,0x87543B,0xE0C08C]
      const paintMats = paintColors.map(color => makeMaterial(new THREE.MeshPhysicalMaterial({
        color, roughness:.2, metalness:.06, clearcoat:1, clearcoatRoughness:.14,
      })))
      for (let i=0;i<19;i++) {
        const size = .024 + (i%4)*.009
        const drop = new THREE.Mesh(makeGeometry(new THREE.IcosahedronGeometry(size,1)),paintMats[i%paintMats.length])
        drop.position.set(1.49 + (i%5)*.13,-1.6+Math.floor(i/5)*.58,.30+(i%3)*.075)
        drop.scale.set(1.1,.64+(i%3)*.18,.45)
        drop.rotation.z=i*.51
        drop.userData.baseY=drop.position.y
        paintDrops.push(drop)
        details.add(drop)
      }

      cacheArtworkOpacity(hero)
      const imageSources = sourcesKey.split('|').filter(Boolean).slice(0,3)
      imageSources.forEach((url,index) => {
        const item = artworkFrame(url,3.35,2.60,sceneLabels[index] || '')
        cacheArtworkOpacity(item.group)
        artworkRoot.add(item.group)
        gallery.push(item.group)
      })

      const points = []
      for(let i=0;i<110;i++) {
        points.push(Math.sin(i*2.37)*8,Math.cos(i*3.17)*5,Math.sin(i*1.13)*5)
      }
      const dustGeometry=makeGeometry(new THREE.BufferGeometry())
      dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points,3))
      particles = new THREE.Points(dustGeometry,makeMaterial(new THREE.PointsMaterial({color:0xb88a44,size:.028,transparent:true,opacity:.55,depthWrite:false})))
      scene.add(particles)
    } catch {
      cleanup()
      onFailed()
      return
    }

    let smoothProgress = motionRef.current.targetProgress ?? motionRef.current.progress * 3
    let mouseX = 0
    let mouseY = 0
    let lastFrame = 0
    let galleryFocus = 0
    function draw(now) {
      raf = 0
      if (disposed || reduce.matches || document.hidden || !stageActive) return
      const elapsed = lastFrame ? now - lastFrame : 1000 / 60
      if (elapsed < 12) {
        raf = requestAnimationFrame(draw)
        return
      }
      lastFrame = now
      const layout = getLayout()
      const dt = elapsed / 1000
      const targetProgress = motionRef.current.targetProgress ?? motionRef.current.progress * 3
      smoothProgress += (targetProgress - smoothProgress) * (1 - Math.exp(-7 * dt))
      const sceneEase = 1 - Math.exp(-elapsed / 235)
      mouseX += (motionRef.current.pointerX - mouseX) * sceneEase
      mouseY += (motionRef.current.pointerY - mouseY) * sceneEase
      const t12=smoothstep(0,1,smoothProgress)
      const t23=smoothstep(1,2,smoothProgress)
      const t34=smoothstep(2,3,smoothProgress)
      const explode=smoothstep(.12,.88,smoothProgress)*(1-smoothstep(1.12,1.82,smoothProgress))
      const time=now*.001

      const cameraZ = smoothProgress < 1
        ? lerp(layout.baseZ,layout.baseZ-.35,t12)
        : smoothProgress < 2
          ? lerp(layout.baseZ-.35,layout.baseZ-1.65,t23)
          : lerp(layout.baseZ-1.65,layout.baseZ+.8,t34)
      const visibleWidthAtZ=z=>2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*Math.max(cameraZ-z,.1)*camera.aspect
      const finaleFrontWidth=visibleWidthAtZ(.2)
      const finaleBackWidth=visibleWidthAtZ(-1.2)
      const heroKeyframes = [
        new THREE.Vector3(layout.heroX,layout.heroY,0),
        new THREE.Vector3(layout.dimX,layout.dimY,.45),
        new THREE.Vector3(layout.galleryX,2.6,-4.8),
        new THREE.Vector3(-finaleFrontWidth*.34,-.1,.2),
      ]
      const heroPosition = smoothProgress < 1
        ? mixVector(heroKeyframes[0],heroKeyframes[1],t12)
        : smoothProgress < 2
          ? mixVector(heroKeyframes[1],heroKeyframes[2],t23)
          : mixVector(heroKeyframes[2],heroKeyframes[3],t34)
      const heroScale = smoothProgress < 1
        ? lerp(layout.heroScale,layout.dimScale,t12)
        : smoothProgress < 2
          ? lerp(layout.dimScale,layout.dimScale*.86,t23)
          : lerp(layout.dimScale*.86,.68,t34)
      const heroRotationY = smoothProgress < 1
        ? lerp(-.28,.54,t12)
        : smoothProgress < 2
          ? lerp(.54,.18,t23)
          : lerp(.18,.42,t34)
      const galleryStartProgress = motionRef.current.galleryStartProgress ?? 1.2
      const finaleStartProgress = motionRef.current.finaleStartProgress ?? 2.1
      const fadeOutStart = Math.max(0,galleryStartProgress-.38)
      const fadeOutEnd = Math.max(fadeOutStart+.01,galleryStartProgress-.035)
      const finaleFadeStart = finaleStartProgress+.025
      const finaleFadeEnd = Math.min(3,finaleFadeStart+.72)
      const isInGalleryScroll = targetProgress >= galleryStartProgress && targetProgress < finaleStartProgress
      const heroOpacity = isInGalleryScroll ? 0 : Math.max(
        1-smoothstep(fadeOutStart,fadeOutEnd,smoothProgress),
        smoothstep(finaleFadeStart,finaleFadeEnd,smoothProgress),
      )
      setArtworkOpacity(hero,heroOpacity)
      artworkRoot.position.x=0
      hero.position.set(heroPosition.x+mouseX*.045,heroPosition.y+Math.sin(time*.72)*.045,heroPosition.z)
      hero.rotation.set(
        lerp(.06,-.08,t12)-mouseY*.035+motionRef.current.orbitX*(1-t34),
        heroRotationY+Math.cos(time*.6)*.012+mouseX*.035+motionRef.current.orbitY*(1-t34),
        lerp(-.1,.06,t12)+Math.sin(time*.42)*.006
      )
      hero.scale.setScalar(heroScale)
      const focused = motionRef.current.focusLayer
      backing.position.z = explode * (-1.24 + (focused === 'backing' ? .22 : 0))
      border.position.z = explode * (-.68 + (focused === 'frame' ? .26 : 0))
      canvas.position.z = .105 + explode * (focused === 'canvas' ? .48 : .12)
      varnish.position.z = .13 + explode * (focused === 'glaze' ? 1.02 : .78)
      details.position.z = explode * (focused === 'ribbon' ? 1.42 : 1.08)
      guideLines.visible = explode > .01 && focused !== 'all'
      guideLines.material.opacity = .42 * explode
      ribbon.rotation.z=Math.sin(time*.4)*.08
      brush.position.set(1.64+explode*.12,-1.07+explode*.09+Math.sin(time)*.035,.62)
      paintDrops.forEach((drop,i) => { drop.position.y = drop.userData.baseY + Math.sin(time * .9 + i) * .042 })
      floorMaterial.opacity = smoothstep(.9,1.9,smoothProgress)*.22
      goldLeaves.forEach(leaf => {
        leaf.position.x = leaf.userData.baseX + Math.sin(time*.32+leaf.userData.phase)*.07
        leaf.position.y = leaf.userData.baseY + Math.cos(time*.27+leaf.userData.phase)*.09
        leaf.rotation.x += Math.sin(time*.2+leaf.userData.phase)*.0008
        leaf.rotation.y += Math.cos(time*.24+leaf.userData.phase)*.001
      })

      // Kamera selalu menghadap karya. Jangan melewati lukisan dan berbalik
      // arah ketika pengunjung terus melakukan scroll.
      const cameraLookZ = smoothProgress < 2
        ? lerp(0,-1.15,t23)
        : lerp(-1.15,0,t34)
      camera.position.set(mouseX*.065*(1-t34),-mouseY*.05*(1-t34),cameraZ)
      camera.lookAt(0,0,cameraLookZ)
      light.position.set(2+mouseX*2,1-mouseY*1.6,5)

      const targetFocus = clamp(motionRef.current.galleryIndex || 0, 0, Math.max(gallery.length - 1, 0))
      galleryFocus += (targetFocus - galleryFocus) * (1 - Math.exp(-elapsed / 170))
      const artProgress = galleryFocus - (motionRef.current.dragOffset || 0)
      gallery.forEach((item,i)=>{
        const distance=i-artProgress
        const separation=Math.abs(distance)
        const focus=clamp(1-separation,0,1)
        const angle=distance*.43
        const stagingPosition = new THREE.Vector3(
          layout.galleryX+(i-1)*1.2,
          layout.galleryY+.15,
          -9.2,
        )
        const pavilionPosition = new THREE.Vector3(
          layout.galleryX+Math.sin(angle)*5.7,
          layout.galleryY-separation*.08,
          -5.9-(1-Math.cos(angle))*4.2+focus*3.4,
        )
        const finalePositions = [
          new THREE.Vector3(-finaleBackWidth*.43,.35,-1.2),
          new THREE.Vector3(finaleFrontWidth*.34,-.1,.2),
          new THREE.Vector3(finaleBackWidth*.43,.35,-1.2),
        ]
        const finalePosition=finalePositions[i] || new THREE.Vector3((i%2?1:-1)*finaleBackWidth*.43,.35,-1.2)
        const itemPosition = smoothProgress < 1
          ? mixVector(stagingPosition,stagingPosition,t12)
          : smoothProgress < 2
            ? mixVector(stagingPosition,pavilionPosition,t23)
            : mixVector(pavilionPosition,finalePosition,t34)
        const pavilionRotationY=-angle*.82
        const finaleRotationY=i===0?.52:i===1?-.42:-.52
        const stageRotationY=(i-1)*-.12
        const itemRotationY = smoothProgress < 1
          ? lerp(stageRotationY,stageRotationY,t12)
          : smoothProgress < 2
            ? lerp(stageRotationY,pavilionRotationY,t23)
            : lerp(pavilionRotationY,finaleRotationY,t34)
        const stageScale=.62
        const pavilionScale=layout.galleryScale*(.76+focus*.31)
        const itemScale = smoothProgress < 1
          ? lerp(stageScale,stageScale,t12)
          : smoothProgress < 2
            ? lerp(stageScale,pavilionScale,t23)
            : lerp(pavilionScale,.68,t34)
        const galleryOpacity=smoothstep(.98,1.86,smoothProgress)
        setArtworkOpacity(item,galleryOpacity)
        item.position.set(itemPosition.x+mouseX*.04,itemPosition.y+Math.sin(time*.62+i)*.04,itemPosition.z)
        item.rotation.set(-.015+Math.sin(time*.4+i)*.004,itemRotationY+mouseX*.025,Math.sin(time*.3+i)*.012)
        item.scale.setScalar(itemScale)
      })
      particles.rotation.y=time*.003
      particles.material.opacity=.34+Math.sin(time*.7)*.08
      renderer.render(scene,camera)
      raf = requestAnimationFrame(draw)
    }
    renderer.domElement.addEventListener('pointerdown',pointerDown)
    renderer.domElement.addEventListener('pointermove',pointerMove)
    renderer.domElement.addEventListener('pointerup',pointerUp)
    renderer.domElement.addEventListener('pointercancel',pointerCancel)
    window.addEventListener('resize',resize,{passive:true})
    window.addEventListener('alteria-studio-visibility',studioVisibilityChange)
    document.addEventListener('visibilitychange',visibilityChange)
    reduce.addEventListener('change',preferenceChange)
    onReady()
    if (stageActive) raf = requestAnimationFrame(draw)
    return cleanup
  }, [sourcesKey,labelsKey,heroImage,motionRef,onSelectArtwork,onReady,onFailed])

  return <div ref={mountRef} style={{position:'absolute',inset:0,overflow:'hidden'}} aria-hidden="true" />
}
