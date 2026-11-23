'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, value) => {
  const t = clamp((value - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function getLayout() {
  const { innerWidth: width, innerHeight: height } = window
  const compactLandscape = width > height && height <= 560
  if (width < 768 && !compactLandscape) {
    return { heroX:.16, heroY:-1, heroScale:.65, dimX:0, dimY:1.03, dimScale:.57, galleryX:.15, galleryY:.72, galleryScale:.64, finaleScale:.73, baseZ:9.8 }
  }
  if (width < 1024) {
    return { heroX:1.25, heroY:-.12, heroScale:.81, dimX:-1.4, dimY:.08, dimScale:.77, galleryX:1.34, galleryY:.08, galleryScale:.81, finaleScale:.83, baseZ:8.9 }
  }
  return { heroX:1.88, heroY:0, heroScale:1.01, dimX:-1.88, dimY:.04, dimScale:.94, galleryX:1.60, galleryY:.04, galleryScale:.96, finaleScale:1.02, baseZ:8.2 }
}

export default function StudioScene({ images = [], heroImage, motionRef, onSelectArtwork, onReady, onFailed }) {
  const mountRef = useRef(null)
  const sourcesKey = images.join('|')

  useEffect(() => {
    const mount = mountRef.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!mount || reduce.matches) { onFailed(); return }

    let renderer
    let raf = 0
    let disposed = false
    let gesture = null
    let inView = true
    let visibilityObserver
    let hero
    let gallery = []
    let particles
    let scene
    let camera
    let light
    let brush
    let ribbon
    let canvas
    let border
    let paintDrops = []
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
          loaded.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
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

    function artworkFrame(url, width=2.75, height=3.45) {
      const group = new THREE.Group()
      const rim = new THREE.Group()
      group.add(rim)
      const walnut=makeMaterial(new THREE.MeshStandardMaterial({
        color:woodGrain ? 0xffffff : 0x805234,map:woodGrain || null,roughness:.52,metalness:0,
      }))
      const darkWood=makeMaterial(new THREE.MeshStandardMaterial({
        color:0x392419,roughness:.61,metalness:.02,
      }))
      const gold=makeMaterial(new THREE.MeshStandardMaterial({
        color:0xb3894c,roughness:.37,metalness:.44,
      }))
      const canvasBacking=makeMaterial(new THREE.MeshStandardMaterial({
        color:0x241c17,roughness:.83,
      }))
      // Lukisan mempertahankan piksel aslinya, tanpa bayangan berlebihan.
      const imageMaterial=makeMaterial(new THREE.MeshBasicMaterial({
        color:0xffffff,side:THREE.DoubleSide,toneMapped:false,
      }))
      addBeveledRing(rim,width,height,0,.18,-.075,walnut,.018)
      addBeveledRing(rim,width,height,.045,.082,.045,darkWood,.012)
      addBeveledRing(rim,width,height,.115,.032,.145,gold,.006)
      addBox(rim,0,0,-.14,width+.06,height+.06,.15,canvasBacking)
      const plane = new THREE.Mesh(
        makeGeometry(new THREE.PlaneGeometry(width-.025,height-.025)),
        imageMaterial,
      )
      plane.position.z=.105
      group.add(plane)
      loadImage(url,imageMaterial,width/height)
      return {group,plane,rim}
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
      return new THREE.Mesh(geometry, makeMaterial(new THREE.MeshStandardMaterial({
        vertexColors: true, side: THREE.DoubleSide, roughness: .67, metalness: 0,
      })))
    }

    function cleanup() {
      if (disposed) return
      disposed = true
      visibilityObserver?.disconnect()
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', visibilityChange)
      window.removeEventListener('resize', resize)
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
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 1024 ? 1.5 : 2))
      renderer.setSize(width,height,false)
    }
    function visibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!disposed && !reduce.matches && inView && !raf) raf = requestAnimationFrame(draw)
    }
    function preferenceChange() {
      if (reduce.matches) {
        cancelAnimationFrame(raf); raf = 0
        if (renderer) renderer.domElement.style.opacity = '0'
        onFailed()
      } else if (!disposed) {
        if (renderer) renderer.domElement.style.opacity = '1'
        onReady()
        if (inView && !raf) raf = requestAnimationFrame(draw)
      }
    }

    try {
      scene = new THREE.Scene()
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

      const heroPart = artworkFrame(heroImage, 2.50, 3.72)
      hero = heroPart.group
      canvas = heroPart.plane
      border = heroPart.rim
      scene.add(hero)

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
      hero.add(ribbon)

      brush = new THREE.Group()
      const handleMat = makeMaterial(new THREE.MeshStandardMaterial({ color:0x614124, roughness:.75 }))
      const metalMat = makeMaterial(new THREE.MeshStandardMaterial({ color:0x9b7650, metalness:.25, roughness:.48 }))
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
      hero.add(brush)

      const paintColors = [0xB56C40,0x637451,0xD4A467,0x87543B,0xE0C08C]
      const paintMats = paintColors.map(color => makeMaterial(new THREE.MeshStandardMaterial({
        color, roughness:.76, metalness:0,
      })))
      for (let i=0;i<19;i++) {
        const size = .024 + (i%4)*.009
        const drop = new THREE.Mesh(makeGeometry(new THREE.IcosahedronGeometry(size,1)),paintMats[i%paintMats.length])
        drop.position.set(1.49 + (i%5)*.13,-1.6+Math.floor(i/5)*.58,.30+(i%3)*.075)
        drop.scale.set(1.1,.64+(i%3)*.18,.45)
        drop.rotation.z=i*.51
        drop.userData.baseY=drop.position.y
        paintDrops.push(drop)
        hero.add(drop)
      }

      for (const url of sourcesKey.split('|').filter(Boolean).slice(0,3)) {
        const item = artworkFrame(url,3.35,2.60)
        scene.add(item.group)
        gallery.push(item.group)
      }

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

    let current = motionRef.current.progress
    let mouseX = 0
    let mouseY = 0
    let lastFrame = 0
    let galleryFocus = 0
    function draw(now) {
      raf = 0
      if (disposed || reduce.matches || document.hidden || !inView) return
      const elapsed = lastFrame ? now - lastFrame : 1000 / 60
      if (elapsed < 12) {
        raf = requestAnimationFrame(draw)
        return
      }
      lastFrame = now
      const layout = getLayout()
      const sceneEase = 1 - Math.exp(-elapsed / 235)
      current += (motionRef.current.progress - current) * sceneEase
      mouseX += (motionRef.current.pointerX - mouseX) * sceneEase
      mouseY += (motionRef.current.pointerY - mouseY) * sceneEase
      const t12=smoothstep(.12,.34,current)
      const t23=smoothstep(.47,.62,current)
      const t34=smoothstep(.86,.97,current)
      const explode=smoothstep(.18,.36,current)*(1-smoothstep(.49,.61,current))
      const galleryHide=t23*(1-t34)
      const time=now*.001

      const hx=lerp(lerp(layout.heroX,layout.dimX,t12),0,t34)
      const hy=lerp(layout.heroY,layout.dimY,t12)+galleryHide*4.2
      const hz=lerp(lerp(0,.45,t12)-galleryHide*3.8,-1.35,t34)
      const scale=lerp(lerp(layout.heroScale,layout.dimScale,t12),layout.finaleScale,t34)
      // Mona Lisa dan semua percikan/kuasnya tidak boleh bocor ke Kurasi Galeri.
      hero.visible = current < .565
      hero.position.set(hx,lerp(hy,.08,t34)+Math.sin(time*.9)*.05,hz)
      hero.rotation.set(
        lerp(lerp(.06,-.08,t12),.04,t34)-mouseY*.06+motionRef.current.orbitX,
        lerp(lerp(-.28,.54,t12),-.22,t34)+Math.cos(time*.6)*.025+mouseX*.09+motionRef.current.orbitY,
        lerp(lerp(-.1,.06,t12),-.05,t34)
      )
      hero.scale.setScalar(scale)
      const focused = motionRef.current.focusLayer
      border.position.z = explode * (-.32 + (focused === 'frame' ? .25 : 0))
      canvas.position.z = .07 + explode * (.65 + (focused === 'canvas' ? .35 : 0))
      ribbon.position.z = explode * (.65 + (focused === 'ribbon' ? .28 : 0))
      ribbon.rotation.z=Math.sin(time*.4)*.08
      brush.position.set(1.64+explode*.12,-1.07+explode*.09+Math.sin(time)*.035,.62+explode*(.54 + (focused === 'ribbon' ? .26 : 0)))
      paintDrops.forEach((drop,i) => { drop.position.y = drop.userData.baseY + Math.sin(time * .9 + i) * .042 })

      // Kamera selalu menghadap karya. Jangan melewati lukisan dan berbalik
      // arah ketika pengunjung terus melakukan scroll.
      camera.position.set(mouseX*.065,-mouseY*.05,layout.baseZ-1.65*t23)
      camera.lookAt(0,0,-1.15*t23)
      light.position.set(2+mouseX*2,1-mouseY*1.6,5)

      const targetFocus = clamp(motionRef.current.galleryIndex || 0, 0, Math.max(gallery.length - 1, 0))
      galleryFocus += (targetFocus - galleryFocus) * (1 - Math.exp(-elapsed / 170))
      const artProgress = galleryFocus - (motionRef.current.dragOffset || 0)
      gallery.forEach((item,i)=>{
        const distance=i-artProgress
        const separation=Math.abs(distance)
        const focus=clamp(1-separation,0,1)
        item.visible=t23>.05 && current<.90 && separation<2.8
        // Karya aktif maju 3.4 unit di sumbu Z dan lebih besar.
        // Karya samping lebih jauh, tetap terlihat dan tetap bisa diklik.
        item.position.set(
          layout.galleryX+distance*2.46,
          layout.galleryY-separation*.12,
          -5.9+focus*3.4,
        )
        item.rotation.set(-.015,-distance*.24,Math.sin(time*.3+i)*.012)
        item.scale.setScalar(layout.galleryScale*(.76+focus*.31))
      })
      particles.rotation.y=time*.003
      renderer.render(scene,camera)
      raf = requestAnimationFrame(draw)
    }
    renderer.domElement.addEventListener('pointerdown',pointerDown)
    renderer.domElement.addEventListener('pointermove',pointerMove)
    renderer.domElement.addEventListener('pointerup',pointerUp)
    renderer.domElement.addEventListener('pointercancel',pointerCancel)
    window.addEventListener('resize',resize,{passive:true})
    document.addEventListener('visibilitychange',visibilityChange)
    reduce.addEventListener('change',preferenceChange)
    onReady()
    if ('IntersectionObserver' in window) {
      visibilityObserver = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting
        if (!inView) { cancelAnimationFrame(raf); raf = 0 }
        else if (!disposed && !reduce.matches && !document.hidden && !raf) raf = requestAnimationFrame(draw)
      }, { rootMargin:'100px' })
      visibilityObserver.observe(mount)
    }
    raf = requestAnimationFrame(draw)
    return cleanup
  }, [sourcesKey,heroImage,motionRef,onSelectArtwork,onReady,onFailed])

  return <div ref={mountRef} style={{position:'absolute',inset:0,overflow:'hidden'}} aria-hidden="true" />
}
