import * as j from "@javelin/ecs";
import { Component, Value } from "@javelin/ecs/dist/declarations/src/component";

import * as THREE from "three";
import { Peer } from "peerjs";
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
} from "./components";
import { app } from "./main";
import {
	CameraResource,
	PeerResource,
	PhysicsResource,
	RendererResource,
	SceneResource,
} from "./resources";
import { addBundle } from "./utils";
import { PhysicsBox, SpecialBox } from "./bundles";

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

export const physicsSystem = (world: j.World) => {
	let physicsWorld = app.getResource(PhysicsResource);

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
	app.addResource(PeerResource, peer);

	function spawn() {
		world.create(Bundle, PhysicsBox);
	}

	const appRoot = document.querySelector("#app") as HTMLElement;

	const [isHost, setIsHost] = createSignal(false);
	const [isClient, setIsClient] = createSignal(false);
	const [roomCode, setRoomCode] = createSignal("");

	enum MessageType {
		Snapshot = 0,
	}

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

			conn.on("open", function () {
				const snapshot: {}[] = []; //world.createSnapshot();
				const replicatedEnts = world.query(Replicate);
				replicatedEnts.each((ent, comps) => {
					let entSnapshot: {}[] = [];
					comps.forEach((comp) => {
						entSnapshot.push({
							type: comp,
							value: world.get(ent, comp),
						});
					});
					snapshot.push({ entity: ent, components: entSnapshot });
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