import * as j from "@javelin/ecs";
import { Component, Value } from "@javelin/ecs/dist/declarations/src/component";

import * as THREE from "three";
import { DataConnection, Peer } from "peerjs";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import html from "solid-js/html";

import {
	Bundle,
	Mesh,
	Position,
	Replicate,
	RigidBody,
	Rotation,
	SpinningBox,
	Velocity,
} from "./components";
import { app } from "./main";
import {
	CameraResource,
	PeerResource,
	PhysicsResource,
	RendererResource,
	SceneResource,
} from "./resources";
import { actions, addBundle, broadcast, bundleMap } from "./utils";
import { PhysicsBox, SpecialBox } from "./bundles";
import RAPIER from "@dimforge/rapier3d-compat";

export const renderSystem = (world: j.World) => {
	let scene = app.getResource(SceneResource);
	let camera = app.getResource(CameraResource);
	let renderer = app.getResource(RendererResource);

	if (!renderer || !scene || !camera) return;
	let meshes = world.query(Position, Rotation, Mesh);
	meshes.each((_entity, position, rotation, meshId) => {
		let mesh = scene!.getObjectById(meshId);
		if (!mesh) return;

		mesh.position.set(position.x, position.y, position.z);
		mesh.setRotationFromQuaternion(
			new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
		);
	});

	renderer.render(scene, camera);
};

export const initThreeSystem = () => {
	let camera = app.getResource(CameraResource);
	let renderer = app.getResource(RendererResource);

	if (!camera) {
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

export const rotateCube = (world: j.World) => {
	let physicsWorld = app.getResource(PhysicsResource);

	if (!physicsWorld) return;

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
	world.monitor(Bundle).eachIncluded((entity) => {
		let bundleId = world.get(entity, Bundle);
		console.log(
			"monitor encountered a new bundle. kicking off the bundle spawning"
		);
		addBundle(world, entity, bundleId!);
	});

};

export const bundleDespawner = (world: j.World) => {
	world.monitorImmediate(Bundle).eachExcluded((entity) => {
		let bundleId = world.get(entity, Bundle);
		const bundle = bundleMap.get( bundleId!);
		bundle?.destroy(world, entity);
	});
}

export const physicsSystem = (world: j.World) => {
	let physicsWorld = app.getResource(PhysicsResource);

	if (!physicsWorld) return;
	//apply physics transformation to components

	const ents = world.query(Position, Rotation, Velocity, RigidBody);
	ents.each((_entity, position, rotation, velocity, rigidbody) => {
		const rb = physicsWorld!.getRigidBody(rigidbody);

		if (!rb) return;

		let replicated = world.get(_entity, Replicate);
		if(replicated && !isHost()) {
			//remove rb maybe
			rb.setLinvel( new RAPIER.Vector3(
				velocity.x,
				velocity.y,
				velocity.z
			), true)

			rb.setTranslation( new THREE.Vector3(
				position.x,
				position.y,
				position.z
			), true);

			rb.setRotation( new RAPIER.Quaternion(
				rotation.x,
				rotation.y,
				rotation.z,
				rotation.w
			), true)

			return;
		}

		position.x = rb.translation().x;
		position.y = rb.translation().y;
		position.z = rb.translation().z;

		rotation.x = rb.rotation().x;
		rotation.y = rb.rotation().y;
		rotation.z = rb.rotation().z;
		rotation.w = rb.rotation().w;

		velocity.x = rb.linvel().x;
		velocity.y = rb.linvel().y;
		velocity.z = rb.linvel().z;
	});
	physicsWorld!.step();
};

export const spawnPhysicsBox = broadcast((world, position: {x: number, y: number, z: number})=>{
	console.log("This should happen everywhere", position);
	if(isHost()){
		//host can check for some condition and return false to prevent the action from being broadcast
		// return false;
	}
	world.create( j.type( Bundle, Position), PhysicsBox,  position)
	return true;

	//return false if this wasn't allowed
})

//key is host entity id. value is my local entity id
export const entityMap = new Map<j.Entity, j.Entity>();
export const replicateSystem = (world: j.World) => {

	world.monitor(Replicate).eachIncluded((entity) => {
		//add new entity to map
		let replicateComponent = world.get(entity,Replicate);
		entityMap.set(replicateComponent!.hostEntity, entity);
	})
	world.monitorImmediate(Replicate).eachExcluded((entity)=> {
		//remove entity from map
		// let replicateComponent = world.get(entity,Replicate)!;
		
		let hostId
		entityMap.forEach((value: number, key: number)=>{
			if(value == entity) {
				hostId = key;
				return;
			}
		});
		if(hostId)
			entityMap.delete(hostId);
	});
};

let clicking = false;
const pointer = new THREE.Vector2();
window.addEventListener("mousedown", (e) => {
	pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
	clicking = true;
	console.log(pointer)
});
window.addEventListener("mouseup", (e) => {console.log(e);clicking = false})
const raycaster = new THREE.Raycaster();
export const broadCastDelete = broadcast((world, hostEnt: j.Entity )=>{
	let ent = entityMap.get(hostEnt)
	world.delete(ent!);
	return true;
});
export const clickAndCastDelete = (world: j.World) => {
	let camera = world.getResource(CameraResource);
	let scene = world.getResource(SceneResource);

	if(clicking){
		raycaster.setFromCamera( pointer, camera );
	
		const intersects = raycaster.intersectObjects( scene.children );
		const meshes = world.query(Mesh);
		meshes.each((entity, mesh)=> {
			let wasClicked = intersects.find((m) => m.object.id === mesh);
			if(wasClicked){
				console.log("delete", entity)
	
				let hostEnt = world.get(entity, Replicate)!.hostEntity
				broadCastDelete(hostEnt)
	
				return;
			}
		})
	}

}

export const [isHost, setIsHost] = createSignal(false);
export const [hostPeer, setHostPeer] = createSignal<DataConnection>();
export const [peers, setPeers] = createSignal<DataConnection[]>([]);

export enum MessageType {
	Snapshot = 0,
	Broadcast = 1,
	BroadcastRequest = 2,
	Sync = 3,
}

export const initUI = (world: j.World) => {
	const peer = new Peer();
	app.addResource(PeerResource, peer);

	function spawn() {
		// world.create(Bundle, PhysicsBox);
		spawnPhysicsBox({x: 0, y: 3, z: 0})

	}

	const appRoot = document.querySelector("#app") as HTMLElement;

	const [isClient, setIsClient] = createSignal(false);
	const [roomCode, setRoomCode] = createSignal("");

	

	type SnapShotArray = {
		entity: j.Entity;
		components: ComponentSnapShot<any>[];
	}[];

	type ComponentSnapShot<T> = {
		type: Component<T>;
		value: Value<T>;
	};

	function host() {
		setIsHost(true);

		world.create(j.type(Bundle, Position), SpecialBox, {
			x: 0.5,
			y: 0,
			z: 0,
		});

		peer.on("connection", function (conn) {
			console.log("user joined my room: ", conn.connectionId);
			setPeers([ conn, ...peers()] )
			conn.on("open", function () {
				const snapshot: {}[] = []; //world.createSnapshot();
				const replicatedEnts = world.query(Replicate);
				replicatedEnts.each((entity, comps) => {
					let entSnapshot: {}[] = [{
						type: Replicate,
						value: comps
					}];
					comps.components.forEach((comp) => {
						entSnapshot.push({
							type: comp,
							value: world.get(entity, comp),
						});
					});
					snapshot.push({ entity: comps.hostEntity, components: entSnapshot });
				});
				console.log("snapshot sending", snapshot);
				conn.send({
					type: MessageType.Snapshot,
					data: snapshot,
				});
			});

			setInterval( async ()=> {
				
				const snapshot: {}[] = []; //world.createSnapshot();
				const replicatedEnts = world.query(Replicate);
				replicatedEnts.each((entity, comps) => {
					let entSnapshot: {}[] = [{
						type: Replicate,
						value: comps
					}];
					comps.components.forEach((comp) => {
						entSnapshot.push({
							type: comp,
							value: world.get(entity, comp),
						});
					});
					snapshot.push({ entity: comps.hostEntity, components: entSnapshot });
				});
				// console.log("snapshot sending", snapshot);
				peers().forEach((conn)=>{
					conn.send({
						type: MessageType.Sync,
						data: snapshot,
					});
				})
				// i++;
			}, 16)

			conn.on("data", function (data: any) {

				if(data.type == MessageType.BroadcastRequest){
					const action = actions.get(data.data.actionId);
					const result = action!(world, data.data.context);
					if(result){
						peers().forEach((peer)=>{
							//assume peer executed this action
							// if(peer != conn)
							peer.send({
								type: MessageType.Broadcast,
								data: data.data
							})
						});
					}{
						console.log("host denied an action from being broadcast", data.data.actionId)
					}
				}
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
			setHostPeer(conn);
			conn.on("data", function (data: any) {
				// console.log("Received", data);

				if (data.type == MessageType.Snapshot) {
					console.log("Received snapshot", data.data);

					(data.data as SnapShotArray).forEach((entitySnapshot) => {
						let types = entitySnapshot.components.map(
							(a) => a.type
						);
						let values = entitySnapshot.components.map(
							(a) => a.value
						);
						//@ts-ignore
						world.create(j.type(...types), ...values);
					});
				} else if (data.type == MessageType.Broadcast) {
					let action = actions.get(data.data.actionId);
					action!(world, data.data.context);
				} else if (data.type == MessageType.Sync) {
					data.data.forEach( (entitySnapshot: any) => {
						//get local entity
						let localEnt = entityMap.get(entitySnapshot.entity)
						if(localEnt){
							entitySnapshot.components.forEach( (component: {type: j.Singleton<any>, value: unknown}) => {
								world.set(localEnt!, component.type, component.value)
							});
						}
						// console.log(localEnt)
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
				<button
					onClick=${spawn}
					disabled=${() => !isHost() && !isClient()}
				>
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

	peer.on("open", function (id) {
		console.log("My peer ID is: " + id);
		render(App, appRoot);
	});
};