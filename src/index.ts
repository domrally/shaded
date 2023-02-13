import axios from 'axios'
import { log } from 'console'
import { config } from 'dotenv'
import fastify from 'fastify'

// this loads the current environment variables from .env
config()

/**
 * this is the single instance of the fastify server
 */
export const Fastify = fastify()
log('Server is initializing')

const { env } = process
log('initialized variables')

// this is the format for the content you can add on to the base url
Fastify.get('/:user/:repo/:file', async (request, reply) => {
	// shaders.site/domrally/pbr/rough
	const { user, repo, file } = request.params as any,
		//
		url = `https://cdn.jsdelivr.net/gh/${user}/${repo}@latest/${file}.`,
		// { data: feature } = await axios.get(
		// 	`https://cdn.jsdelivr.net/gh/${u}/${r}/${f}`
		// ),
		//  { data: model } = await axios.get(`${url}obj`),
		//  { data: pixel } = await axios.get(`${url}glsl`),
		{ data: vertex } = await axios.get(`${url}vert`),
		{ data: fragment } = await axios.get(`${url}frag`)

	reply.type('text/html').send(`
	<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>shaders·site</title>
		<style>
			body {
				margin: 0;
			}
		</style>
	</head>
	<body>
	<script type="module"> 
		import * as THREE from 'https://cdn.jsdelivr.net/npm/three/+esm'
		// import axios from https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js

			const {
					AmbientLight,
					BufferGeometryLoader,
					Color,
					DirectionalLight,
					HemisphereLight,
					Mesh,
					MeshLambertMaterial,
					MeshToonMaterial,
					PerspectiveCamera,
					PointLight,
					Scene,
					ShaderMaterial,
					TorusKnotGeometry,
					Vector2,
					Vector3,
					Vector4,
					WebGLRenderer,
				} = THREE,
				loader = new BufferGeometryLoader(),
				scene = new Scene(),
				{ innerWidth: width, innerHeight: height } = window,
				camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000),
				hemisphereLight = new HemisphereLight(0xffffbb, 0x080820, 0.5),
				directionalLight = new DirectionalLight(),
				ambientLight = new AmbientLight(0x004040),
				pointLight = new PointLight(0xff0000, 0.5, 100),
				material = new ShaderMaterial({
					vertexShader: \`${vertex}\`,
					fragmentShader: \`${fragment}\`,
				}),
				renderer = new WebGLRenderer()

			pointLight.position.set(-5, 5, 5)
			renderer.setSize(window.innerWidth, window.innerHeight)
			document.body.appendChild(renderer.domElement)
			camera.position.z = 5
			scene.background = new Color(0x00ff00)
			scene.add(pointLight)
			scene.add(directionalLight)
			scene.add(ambientLight)

			//
			loader.load(
				'https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/models/json/suzanne_buffergeometry.json',
				// onLoad callback
				geometry => {
					geometry.computeVertexNormals()
					const object = new Mesh(geometry, material)

					directionalLight.position.set(50, 50, 50)
					directionalLight.target = object

					scene.add(object)

					function animate() {
						object.rotation.y += 0.01

						renderer.render(scene, camera)

						requestAnimationFrame(animate)
					}
					animate()
				},
				// onProgress callback
				xhr => console.log((xhr.loaded / xhr.total) * 100 + '% loaded'),
				// onError callback
				err => console.log('An error happened')
			)
		</script>
	</body>
</html>
  `)
})

//
await Fastify.ready()
log('Server is ready')

//
const port = parseInt(env['PORT'] || '3000')
await Fastify.listen({ port })
log(`Server is listening on port: ${port}`)
