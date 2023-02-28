import axios from 'axios'
import { log } from 'console'
import { config } from 'dotenv'
import fastify from 'fastify'
import { Model } from './Model'
// @ts-ignore
import xhr2 from 'xhr2'

// this loads the current environment variables from .env
config()
;(global as any).XMLHttpRequest = xhr2.XMLHttpRequest

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
function getHtml(
	vertex: string,
	fragment: string,
	{
		position,
		normal,
		uv,
		index,
	}: {
		position: string
		normal: string
		uv: string
		index: string
	}
) {
	return `<!DOCTYPE html>
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

			const {
					Float32BufferAttribute,
					BufferAttribute,
					BufferGeometry,
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
				scene = new Scene(),
				{ innerWidth: width, innerHeight: height } = window,
				camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000),
				material = new ShaderMaterial({
					vertexShader: \`${vertex}\`,
					fragmentShader: \`${fragment}\`,
				}),
				renderer = new WebGLRenderer(),
				geometry = new BufferGeometry()

			renderer.setSize(window.innerWidth, window.innerHeight)
			document.body.appendChild(renderer.domElement)
			camera.position.z = 3
			camera.fov = 17
			scene.background = new Color(0x00ff00)

			// itemSize = 3 because there are 3 values (components) per vertex
			geometry.setAttribute('position', new Float32BufferAttribute([${position}], 3))
			geometry.setAttribute('normal', new Float32BufferAttribute([${normal}], 3))
			geometry.setAttribute('uv', new Float32BufferAttribute([${uv}], 2))
			geometry.setIndex([${index}])

			const object = new Mesh(geometry, material)

			scene.add(object)

			function animate() {
				object.rotation.y += 0.01

				renderer.render(scene, camera)

				requestAnimationFrame(animate)
			}
			animate()
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
			{ data: vertex } = await axios.get(`${url}vert`),
			{ data: fragment } = await axios.get(`${url}frag`),
			model = await Model.Load(u, r, f)

		reply.type('text/html').send(getHtml(vertex, fragment, model))
	} catch (error) {
		console.log(error)
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
			{ data: vertex } = await axios.get(`${url}vert`),
			{ data: fragment } = await axios.get(`${url}frag`),
			{ position } = await Model.Load(user, repo, `${file}.glb`)

		reply
			.type('text/html')
			.send(getHtml(vertex, fragment, position!.toString()))
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
