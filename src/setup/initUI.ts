import { World } from "@lastolivegames/becsy";
import { Bundle } from "../schemas";
import { createEntityQueue, peer } from "../main";

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import html from "solid-js/html";
import { PhysicsBox } from "./bundles";
import { spawnStaticCube } from "./scene";

export function initUI(world: World) {
	function spawn() {
		console.log("Spawn")
		createEntityQueue.push([Bundle, { id: PhysicsBox }])
		// world.createEntity(Bundle, { id: PhysicsBox });
	}

	const appRoot = document.querySelector("#app") as HTMLElement;

	const [isHost, setIsHost] = createSignal(false);
	const [isClient, setIsClient] = createSignal(false);
	const [roomCode, setRoomCode] = createSignal("");
	// let roomCode = "";
	// console.log(peer)
	peer.on("open", function (id) {
		console.log("My peer ID is: " + id);
	});

	enum MessageType {
		Snapshot = 0,
	}

	function host() {
		console.log("hi");
		setIsHost(true);

		spawnStaticCube(world);

		peer.on("connection", function (conn) {
			console.log("user joined my room: ", conn.connectionId);

			conn.on("open", function () {
				const snap: any[] = []//world.createSnapshot();
				console.log("snapshot sending", snap);
				conn.send({
					type: MessageType.Snapshot,
					data: snap,
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
					// world.reset();
					// world = createWorld({ snapshot: data.data });
					//TODO reimplement apply snapshot
					// applySnapShot(data.data);
				}
			});

			// Send messages
			conn.send("Hey i just joined! " + peer.id);
		});
	}

	const App = () => {
		return html`
			<div>
				<button onClick=${spawn} >
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

	render(App, appRoot);
}
