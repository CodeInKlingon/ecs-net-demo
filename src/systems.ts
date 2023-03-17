import * as j from "@javelin/ecs";
import { GameInputs } from 'game-inputs'

import * as THREE from "three";
import { DataConnection, Peer } from "peerjs";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import html from "solid-js/html";

import {
	Bundle,
	HasLocalAuthority,
	Mesh,
	Player,
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
import { rpcQueue, rpcDictionary, addBundle, defineRPC, bundleMap, enqueueRPC, nextStep } from "./utils";
import { PhysicsBox, SpecialBox } from "./bundles";
import RAPIER from "@dimforge/rapier3d-compat";
import { spawnPhysicsBox, spawnPlayer } from "./actions";
import { EntitySnapshot, MessageType, ReplicateQueryToSnapshot, SyncSnapshot } from "./net";

export const renderSystem = (world: j.World) => {
	let scene = app.getResource(SceneResource);
	let camera = app.getResource(CameraResource);
	let renderer = app.getResource(RendererResource);

	if (!renderer || !scene || !camera) return;
	let meshes = world.query(Position, Rotation, Mesh);
	meshes.each((_entity, position, rotation, meshId) => {
		let mesh = scene!.getObjectById(meshId);
		if (!mesh) return;

		if(position)
		mesh.position.set(position.x, position.y, position.z);
		if(rotation)
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

	window.addEventListener("resize", () => {
		
		camera!.aspect = window.innerWidth / window.innerHeight;
		camera!.updateProjectionMatrix();
		renderer!.setSize(window.innerWidth, window.innerHeight);
	})
};

export const rotateCube = (world: j.World) => {
	let physicsWorld = app.getResource(PhysicsResource);

	if (!physicsWorld) return;

	const cube = world.query(RigidBody, Rotation, SpinningBox);
	cube.each((_entity, handle, rotation) => {
		const rb = physicsWorld!.bodies.get(handle);
		if (!rb) return;

		// const rot = rb.rotation();
		const q = new THREE.Quaternion(rotation.x,
			rotation.y,
			rotation.z,
			rotation.w);

		q.multiply(new THREE.Quaternion(1, 1, 0.01, 0.01));
		if(!SynchedThisStep){

			rotation.x = q.x;
			rotation.y = q.y;
			rotation.z = q.z;
			rotation.w = q.w;
		}

		rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
	});
};

//bundle managemnet system. spawns and de spawns entities with bundle components using a monitor
export const bundleSpawner = (world: j.World) => {
	world.monitor(Bundle).eachIncluded((entity) => {
		
		nextStep(()=>{
			if (world.has(entity, Bundle) ) {
				let bundleId = world.get(entity, Bundle);
				console.log(
					"monitor encountered a new bundle. kicking off the bundle spawning"
				);
				if(bundleId)
				addBundle(world, entity, bundleId!);
			}
		});
	});

};

let SynchedThisStep = false;
export const bundleDespawner = (world: j.World) => {
	world.monitorImmediate(Bundle).eachExcluded((entity) => {
		let bundleId = world.get(entity, Bundle);
		const bundle = bundleMap.get( bundleId!);
		bundle?.destroy(world, entity);
	});
}

export const syncResetSystem = (_world: j.World) => {
	SynchedThisStep = false;
}

export const applySyncSnapshot = (world: j.World) => {
	
	// console.log("snapshot this step" , SyncSnapshot.latest)

	if(SyncSnapshot.latest.length > 0){
		SynchedThisStep = true;
	}

	//apply snapshot
	SyncSnapshot.latest.forEach( (entitySnapshot: EntitySnapshot) => {
		//get local entity
		let localEnt = entityMap.get(entitySnapshot.entity)
		if(localEnt){
			// console.log("local ent exists in map")
			//apply component values
			//mark this as being updated this step
			if(world.has(localEnt, Replicate)){
				// console.log("local ent has replicate component")

				let replicateComponent = world.get(localEnt, Replicate);

				if(replicateComponent?.peerWithAuthority != myPeerID()){
					
					// console.log("mark as updated this step", world.get(localEnt, Replicate));
					
					entitySnapshot.components.forEach( (component) => {	
						if(world.exists(localEnt!) && world.has(localEnt!, component.component)){
							// console.log("our local component has this component. Good")

							if(component.type == "value"){
								// console.log("and the component is a value component", component.value)

								world.set(localEnt!, component.component, component.value)
							}
						}
					});
				}

			}

		}
	});

	//clear queue
	SyncSnapshot.latest = [];
}

let lastTime = performance.now();
const INTERVAL = 60;
export const syncIntervalSystem = (world: j.World) => {
	//only execute system at set interval
	const currentTime = performance.now();
	if (currentTime - lastTime < INTERVAL) return;
	lastTime = currentTime;

	//make snapshot for all peers
	if(isHost() && peers().length > 0){
		const snapshot = ReplicateQueryToSnapshot(world, myPeerID())

		peers().forEach((conn)=>{
			conn.send({
				type: MessageType.Sync,
				data: snapshot,
			});
		})

		return;
	}

	//client sends their updates to host
	if(hostPeer()){
		const snapshot = ReplicateQueryToSnapshot(world, myPeerID(), true)
		if(snapshot.length > 0){
			hostPeer()!.send({
				type: MessageType.Sync,
				data: snapshot
			})
		}
	}


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

		//instead of applying the simulation to our components operate the other way.
		if(replicated && replicated.peerWithAuthority != myPeerID() && SynchedThisStep) {
			//remove rb maybe
			if(velocity)
			rb.setLinvel( new RAPIER.Vector3(
				velocity.x,
				velocity.y,
				velocity.z
			), true)

			if(position)
			rb.setTranslation( new THREE.Vector3(
				position.x,
				position.y,
				position.z
			), true);

			if(rotation)
			rb.setRotation( new RAPIER.Quaternion(
				rotation.x,
				rotation.y,
				rotation.z,
				rotation.w
			), true)

			return;
		}
		
		if(position){
			position.x = rb.translation().x;
			position.y = rb.translation().y;
			position.z = rb.translation().z;
		}

		if(rotation){
			rotation.x = rb.rotation().x;
			rotation.y = rb.rotation().y;
			rotation.z = rb.rotation().z;
			rotation.w = rb.rotation().w;
		}

		if(velocity){
			velocity.x = rb.linvel().x;
			velocity.y = rb.linvel().y;
			velocity.z = rb.linvel().z;
		}
	});
	physicsWorld!.step();
};

var domElement = document.querySelector('#app')
var inputs = new GameInputs(domElement as HTMLElement, {
  preventDefaults: true, 
  allowContextMenu: false,
  stopPropagation: false,
  disabled: false
})
inputs.bind( 'move-left', 'KeyA', 'ArrowLeft' )
inputs.bind( 'move-right', 'KeyD', 'ArrowRight' )
inputs.bind( 'move-forward', 'KeyW', 'ArrowUp' )
inputs.bind( 'move-back', 'KeyS', 'ArrowDown' )

export const playerMovement = (world: j.World) => {
	const physicsWorld = world.getResource(PhysicsResource);
	const players = world.query(Player, RigidBody, Rotation, HasLocalAuthority);

	players.as(RigidBody, Rotation).each((_entity, rbHandle, rotation) => {
		// console.log("player entity", entity)
		let rigidBody = physicsWorld.getRigidBody(rbHandle)

		var leftAmount = inputs.state['move-left']? 1: 0;
		var rightAmount = inputs.state['move-right']? 1: 0;
		var forwardAmount = inputs.state['move-forward']? 1: 0;
		var backAmount = inputs.state['move-back']? 1: 0;

		let move = new THREE.Vector3(rightAmount - leftAmount, 0, forwardAmount - backAmount);
		
		if(rotation)
		move.applyQuaternion( new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w) )

		// console.log("apply", rightAmount - leftAmount)
		rigidBody.applyImpulse(move, true)
	});
}

export const rpcExecutorSystem = (world: j.World) => {
	rpcQueue.queue.forEach((actionInQueue) => {

		if(isHost()){
			
			let action = rpcDictionary.get(actionInQueue.actionId);
			let result = action!(world, actionInQueue.context);
			console.log(result.newContext)
			if(result.broadcast){
					peers().forEach((conn) => {
						console.log("send to conn");
						conn.send({
							type: MessageType.Broadcast,
							data: {
								actionId: actionInQueue.actionId,
								context: result.newContext
							}
						})
					});
			}
		}else{
			hostPeer()?.send({
				type: MessageType.BroadcastRequest,
				data: {
					actionId: actionInQueue.actionId,
					context: actionInQueue.context
				}
			})
		}
	})

	rpcQueue.queue = [];
}

//key is host entity id. value is my local entity id
export const entityMap = new Map<j.Entity, j.Entity>();
export const replicateSystem = (world: j.World) => {

	world.monitor(Replicate).eachIncluded((entity) => {
		//add new entity to map
		let replicateComponent = world.get(entity, Replicate);
		console.log("new replicate ent", replicateComponent)
		if(isHost()){
			console.log("add to entity map", entity, entity)
			entityMap.set(entity, entity);
			replicateComponent!.hostEntity = entity
		}else{
			console.log("add to entity map", replicateComponent!.hostEntity!, entity)
			entityMap.set(replicateComponent!.hostEntity!, entity);
		}

		if(replicateComponent?.peerWithAuthority && replicateComponent.peerWithAuthority == myPeerID()){
			console.log("set has local auth")
			world.add(entity, HasLocalAuthority);
		}
	})
}

export const replicateCleanUp = (world: j.World) => {
	world.monitorImmediate(Replicate).eachExcluded((entity)=> {
		//remove entity from map
		let replicateComponent = world.get(entity,Replicate)!;
		if(isHost()){
			console.log("remove from map", entity)

			entityMap.delete(entity);
		}else{
			entityMap.delete(replicateComponent!.hostEntity!);
		}
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
export const broadCastDelete = defineRPC((world: j.World, hostEnt: j.Entity ) => {
	console.log(entityMap)
	let ent = entityMap.get(hostEnt)
	console.log("delete", ent);
	world.delete(ent!);
	return {broadcast: true, newContext: hostEnt};
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
				console.log("who to delete", hostEnt ?? entity)
				broadCastDelete(hostEnt ?? entity)
	
				return;
			}
		})
	}

}

export const [isHost, setIsHost] = createSignal(false);
export const [hostPeer, setHostPeer] = createSignal<DataConnection>();
export const [peers, setPeers] = createSignal<DataConnection[]>([]);
export const [myPeerID, setMyPeerId] = createSignal<string>("");



export const initUI = (world: j.World) => {
	const peer = new Peer();
	app.addResource(PeerResource, peer);

	function spawn() {
		// world.create(Bundle, PhysicsBox);
		spawnPhysicsBox({ position: {x: 0, y: 3, z: 0}, bundle: PhysicsBox})

	}

	const appRoot = document.querySelector("#app") as HTMLElement;

	const [isClient, setIsClient] = createSignal(false);
	const [roomCode, setRoomCode] = createSignal("");


	function host() {
		setIsHost(true);

		world.create(j.type(Bundle, Position, Replicate, SpinningBox), SpecialBox, {
			x: 0.5,
			y: 0,
			z: 0,
		}, {
			hostEntity: undefined,
			components: [Bundle, Position, Rotation, Velocity, SpinningBox],
			peerWithAuthority: myPeerID()
		});

		peer.on("connection", function (conn) {
			console.log("user joined my room: ", conn.connectionId);
			setPeers([ conn, ...peers()] )

			if(peers().length == 1){
				setTimeout(()=>{
					spawnPlayer({position: {x: -1, y: 1, z: 0}, peerWithAuthority: myPeerID()})
				}, 2000)
			}

			conn.on("open", function () {
				const snapshot = ReplicateQueryToSnapshot(world, myPeerID())

				console.log("snapshot sending with length", snapshot.length);

				conn.send({
					type: MessageType.Snapshot,
					data: snapshot,
				});

				setTimeout(()=>{
					spawnPlayer({position: {x: 2, y: 0, z: 0}, peerWithAuthority: conn.peer})
				}, 2000)

			});

			conn.on("data", function (data: any) {

				if(data.type == MessageType.BroadcastRequest){
					enqueueRPC( data.data.actionId, data.data.context)
				} else if (data.type == MessageType.Sync) {

					SyncSnapshot.latest = [...SyncSnapshot.latest, ...data.data];
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
					console.log("Received snapshot with length", data.data);

					(data.data as EntitySnapshot[]).forEach((entitySnapshot) => {
						let types = entitySnapshot.components.map(
							(a) => a.component
						);
						let values = entitySnapshot.components.map(
							(a) => a.type == "value" ? a.value : undefined
						);
						//@ts-ignore
						world.create(j.type(...types), ...values);
					});
				} else if (data.type == MessageType.Broadcast) {
					let action = rpcDictionary.get(data.data.actionId);
					action!(world, data.data.context);
				} else if (data.type == MessageType.Sync) {

					SyncSnapshot.latest = data.data;
					

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
		setMyPeerId(id);
		console.log("My peer ID is: " + id);
		render(App, appRoot);
	});
};