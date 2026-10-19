import * as THREE from 'three/webgpu'
import { GaussianSplat, OrbitControls, SPZLoader } from 'three/examples/jsm/Addons.js'
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js'

// =======================
// scene
// =======================
const canvas = document.querySelector<HTMLCanvasElement>('canvas')!

const renderer = new THREE.WebGPURenderer({ canvas })
renderer.setPixelRatio(Math.max(window.devicePixelRatio, 2))
renderer.inspector = new Inspector()
renderer.outputColorSpace = THREE.NoColorSpace
await renderer.init()

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
camera.position.set(0, 0, 3)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.1

// =======================
// model
// =======================
const models: { [key in string]: { name: string; file: string; splat: GaussianSplat | null } } = {
  ray_dau: {
    name: 'レ・ダウ',
    file: 'ray_dau.spz',
    splat: null,
  },
  shagaru_magala: {
    name: 'シャガルマガラ',
    file: 'shagaru_magala.spz',
    splat: null,
  },
}

await Promise.all(
  Object.entries(models).map(async ([key, val]) => {
    const geometry = await new SPZLoader().loadAsync(import.meta.env.BASE_URL + `assets/${val.file}`)
    const splat = new GaussianSplat(geometry)
    if (key === 'ray_dau') {
      splat.applyMatrix4(new THREE.Matrix4().multiplyScalar(5))
      splat.applyMatrix4(new THREE.Matrix4().makeTranslation(new THREE.Vector3(-0.2, 0.2, 0)))
    } else if (key === 'shagaru_magala') {
      splat.applyMatrix4(new THREE.Matrix4().multiplyScalar(4.5))
      splat.applyMatrix4(new THREE.Matrix4().makeTranslation(new THREE.Vector3(0, 0.1, 0)))
    }
    splat.name = key
    splat.visible = key === Object.keys(models)[0]
    scene.add(splat)
    val.splat = splat
  }),
)

// =======================
// setting
// =======================
const params = {
  source: models.ray_dau.name,
}

const gui = (renderer.inspector as Inspector).createParameters('Building')
gui
  .add(
    params,
    'source',
    Object.values(models).map((m) => m.name),
  )
  .name('Splat')
  .onChange((value) => {
    const key = Object.keys(models).find((key) => models[key].name === value)
    Object.entries(models).forEach(([k, v]) => {
      v.splat!.visible = k === key
    })
    controls.reset()
  })

// =======================
// render
// =======================
function render() {
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

render()

// =======================
// resize
// =======================
const observer = new ResizeObserver((entries) => {
  const { inlineSize: width, blockSize: height } = entries[0].contentBoxSize[0]
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
})

observer.observe(canvas, { box: 'content-box' })
