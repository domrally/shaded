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

function get404() {
	return `
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
		<h1>404</h1>
		<p>Not Found</p>
	</body>
</html>
	`
}
function getHtml(vertex: string, fragment: string) {
	return `
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
					BufferGeometryLoader,
					TorusKnotGeometry,
					Color,
					Mesh,
					PerspectiveCamera,
					Scene,
					ShaderMaterial,
					Vector2,
					Vector3,
					Vector4,
					WebGLRenderer,
				} = THREE,
				loader = new BufferGeometryLoader(),
				scene = new Scene(),
				{ innerWidth: width, innerHeight: height } = window,
				camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000),
				material = new ShaderMaterial({
					vertexShader: \`${vertex}\`,
					fragmentShader: \`${fragment}\`,
				}),
				renderer = new WebGLRenderer()

			renderer.setSize(window.innerWidth, window.innerHeight)
			document.body.appendChild(renderer.domElement)
			camera.position.z = 3
			camera.fov = 16
			scene.background = new Color(0x00ff00)

			//
			loader.load(
				'https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/models/json/suzanne_buffergeometry.json',
				// onLoad callback
				geometry => {
					geometry.computeVertexNormals()
					const object = new Mesh(new TorusKnotGeometry(), material)

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
  `
}

// perfect
Fastify.get('/*', async (_, reply) => {
	reply.type('text/html').send(get404())
})

// homepage
Fastify.get('/', async (_, reply) => {
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
					<h1>shaders·site</h1>
					<p>shaders·site is a collection of shaders that are hosted on github and served by jsdelivr</p>
					<p>the url format is https://shaders.site//:user/:repo/:file</p>
					<p>the remix format is https://shaders.site//:user/:repo/:file//:u/:r/:f</p>
					</body>
					</html>
`)
})

Fastify.get('//:user/:repo/:file//:u/:r/:f', async (request, reply) => {
	try {
		const { user, repo, file, u, r, f } = request.params as any,
			// this is the format for the content you can add on to the base url
			// https://shaders.site/domrally/pbr/smooth//mrdoob/three.js/suzanne.vert
			url = `https://cdn.jsdelivr.net/gh/${user}/${repo}@latest/${file}.`,
			{ data: feature } = await axios.get(
				`https://cdn.jsdelivr.net/gh/${u}/${r}/${f}`
			),
			// { data: model } = await axios.get(`${url}obj`),
			// { data: pixel } = await axios.get(`${url}glsl`),
			{ data: vertex } = await axios.get(`${url}vert`),
			{ data: fragment } = await axios.get(`${url}frag`)

		let vertexShader = vertex,
			fragmentShader = fragment

		if (f.includes('.vert')) {
			vertexShader = feature
		} else if (f.includes('.frag')) {
			fragmentShader = feature
		}

		reply.type('text/html').send(getHtml(vertexShader, fragmentShader))
	} catch (error) {
		reply.type('text/html').send(get404())
	}
})

// this is the format for the content you can add on to the base url
Fastify.get('//:user/:repo/:file', async (request, reply) => {
	// shaders.site/domrally/pbr/rough

	try {
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

		reply.type('text/html').send(getHtml(vertex, fragment))
	} catch (error) {
		reply.type('text/html').send(get404)
	}
})

//
await Fastify.ready()
log('Server is ready')

//
const port = parseInt(env['PORT'] || '3000'),
	host = env['HOST'] || '0.0.0.0'

await Fastify.listen({ host, port })
log(`Server is listening on port: ${port}`)
