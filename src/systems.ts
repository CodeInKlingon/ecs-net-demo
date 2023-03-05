import * as j from '@javelin/ecs';
import * as THREE from "three";
import { Peer } from "peerjs";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import html from "solid-js/html";

import { Bundle, Mesh, Position, Replicate, RigidBody, Rotation, SpinningBox } from './components';
import { app } from './main';
import { CameraResource, PeerResource, PhysicsResource, RendererResource, SceneResource } from './resources';
import { bundleMap } from './utils';
import { PhysicsBox, SpecialBox } from "./bundles";

export const renderSystem = (world: j.World) => {
    let scene = app.getResource(SceneResource)
    let camera = app.getResource(CameraResource)
    let renderer = app.getResource(RendererResource)
  
    if(!renderer|| !scene || !camera) return;
    let meshes = world.query(Position, Rotation, Mesh);
    meshes.each((_entity, position, rotation, meshId) => {
      let mesh = scene!.getObjectById(meshId);
      if(!mesh) return;
      
      // console.log(rotation)
      mesh.position.set(position.x, position.y, position.z);
      mesh.setRotationFromQuaternion(
        new THREE.Quaternion(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w
        )
    );
    });

    renderer.render(scene, camera);
};

  
export const initThreeSystem = () => {
    let camera = app.getResource(CameraResource)
    let renderer = app.getResource(RendererResource)
  
    if(!camera){
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
    }
    
    camera.position.z = 10;
  
    renderer!.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer!.domElement);
};

export const rotateCube = (world : j.World) => {
  let physicsWorld = app.getResource(PhysicsResource);

  if(!physicsWorld) return;

  const cube = world.query(RigidBody, SpinningBox);
	cube.each((_entity, handle) => {
		const rb = physicsWorld!.bodies.get(handle);
		if (!rb) return;

		const rot = rb.rotation();
		const q = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

		q.multiply(new THREE.Quaternion(1, 1, 0.01, 0.01));

		rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
  });
};

//bundle managemnet system. spawns and de spawns entities with bundle components using a monitor
export const bundleSpawner = (world: j.World) => {
  // const bundles = world.query(Bundle);

  world.monitor(Bundle).eachIncluded((entity) => {
    let bundleId = world.get(entity, Bundle);

    if (bundleId && bundleMap.has(bundleId)) {
      const bundle = bundleMap.get(bundleId);
      bundle?.create(world, entity);
    } else {
      console.log(
        "tried to spawn a bundle but couldn't find the definition", bundleId
      );
    }
  });

};


export const physicsSystem = (world: j.World) => {

  let physicsWorld = app.getResource(PhysicsResource)
  
  if (!physicsWorld) return;
	//apply physics transformation to components
  
  const ents = world.query(Position, Rotation, RigidBody);
	ents.each((_entity, position, rotation, rigidbody) => {
		const rb = physicsWorld!.getRigidBody(rigidbody);

		if (!rb) return;

		position.x = rb.translation().x;
		position.y = rb.translation().y;
		position.z = rb.translation().z;

		rotation.x = rb.rotation().x;
		rotation.y = rb.rotation().y;
		rotation.z = rb.rotation().z;
		rotation.w = rb.rotation().w;
	});
	physicsWorld!.step();
};




export const initUI = (world: j.World) => {
	const peer = new Peer();
	app.addResource(PeerResource, peer)

	function spawn() {
		// const newEntity = world.create();
		// const bundleComponent = component(Bundle, { id: PhysicsBox });
		// world.attach(newEntity, bundleComponent);
    	world.create(Bundle, PhysicsBox );

	}

	const appRoot = document.querySelector("#app") as HTMLElement;

	const [isHost, setIsHost] = createSignal(false);
	const [isClient, setIsClient] = createSignal(false);
	const [roomCode, setRoomCode] = createSignal("");


	enum MessageType {
		Snapshot = 0,
	}

	function host() {
		setIsHost(true);

    	world.create(Bundle, SpecialBox );

		peer.on("connection", function (conn) {
			console.log("user joined my room: ", conn.connectionId);

			conn.on("open", function () {
				const snapshot: {}[] = [];//world.createSnapshot();
        		const replicatedEnts = world.query(Replicate);
				replicatedEnts.each((ent, comps) => {
					let entSnapshot:{}[] = []
					console.log("ent", ent)
					console.log("comps", comps)
					comps.forEach(comp => {
						entSnapshot.push({
							type: comp,
							value: world.get(ent, comp),
						});
					});
					snapshot.push({entity: ent, components: entSnapshot});
				});
				console.log("snapshot sending", snapshot);
				conn.send({
					type: MessageType.Snapshot,
					data: snapshot,
				});
			});

			conn.on("data", function (data) {
				// Will print 'hi!'
				console.log(conn.connectionId, " says ", data);
			});
		});
	}

	function joinRoom() {
		setIsClient(true);
		console.log(roomCode());
		const conn = peer.connect(roomCode());
		conn.on("open", function () {
			// Receive messages
			conn.on("data", function (data: any) {
				console.log("Received", data);

				if (data.type == MessageType.Snapshot) {
					console.log("Received snapshot", data.data);

					data.data.forEach(entitySnapshot => {
						//batch create new ent
						let types = entitySnapshot.components.map(a => a.type);
						let values: any[] = entitySnapshot.components.map(a => a.value);
						// debugger;
						let e = world.create(j.type(...types), ...values)
						console.log(...types,...values)
						
						//just first comp - this works! but why not the others?!
						// let ent = world.create(entitySnapshot.components[0].type, entitySnapshot.components[0].value);
						// console.log(entitySnapshot.components[0].type, entitySnapshot.components[0].value);
						// console.log("ent snap comps",entitySnapshot.components[0]);
						
						//but if I add the rest it breaks
						// for(let i = 1; i < entitySnapshot.components.length; i++) {
						//   console.log("ent snap comps",entitySnapshot.components[i]);
						//   world.add(ent, entitySnapshot.components[i].type, entitySnapshot.components[i].value )
						//   console.log(entitySnapshot.components[i].type, entitySnapshot.components[i].value);
						// }

						//loop style. add one by one
						// let newEnt = world.create();
						// entitySnapshot.components.forEach(compSnapshot => {
						//   world.add(newEnt, compSnapshot.type, compSnapshot.value)
						//   console.log("type:", compSnapshot.type)
						//   console.log("value:", compSnapshot.value)
						// });

					});
				}
			});

			// Send messages
			conn.send("Hey i just joined! " + peer.id);
		});
	}

	const App = () => {
		return html`
			<div>
				<button onClick=${spawn} disabled=${() => (!isHost() && !isClient())}>
					Spawn Cube
				</button>
				<button
					onClick=${host}
					disabled=${() => isHost() || isClient()}
				>
					${() => (isHost() ? "Hosting" : "Host a match")}
				</button>
				${() => {
					return isHost() ? "Room code: " + peer.id : "";
				}}
			</div>
			<div>
				<button
					onClick=${() => joinRoom()}
					disabled=${() => isHost() || isClient()}
				>
					${() => (isClient() ? "In match" : "Join a match")}
				</button>
				<input
					value=${() => roomCode()}
					onInput=${(e: any) => setRoomCode(e.target.value)}
					placeholder="Enter host id"
				/>
			</div>
		`;
	};

	peer.on('open', function(id) {
		console.log('My peer ID is: ' + id);
		render(App, appRoot);
	});
}