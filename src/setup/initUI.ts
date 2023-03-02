import { component, createWorld, World } from '@javelin/ecs';
import { Bundle } from '../schemas';
import { applySnapShot, peer } from '../main';

// import Peer from 'peerjs';

import {
    createSignal,
    // onCleanup,
  } from "solid-js";
  import { render } from "solid-js/web";
  import html from "solid-js/html";
// import { defineBundle } from './prefab';
import { PhysicsBox } from './bundles';
import { spawnStaticCube } from './scene';

export function initUI (world: World) {

    let button = document.createElement("button");
    button.innerText = "Spawn Cube";

    button.addEventListener('click', () => {

    });

    

    function spawn() {
        let newEntity = world.create();
    	let bundleComponent = component(Bundle, {id: PhysicsBox})
        world.attach(newEntity, bundleComponent);

    }

    let appRoot = document.querySelector("#app") as HTMLElement;

    const [isHost, setIsHost] = createSignal(false);
    const [isClient, setIsClient] = createSignal(false);
    const [roomCode, setRoomCode] = createSignal("");
    // let roomCode = "";
    // console.log(peer)
    peer.on('open', function(id) {
        console.log('My peer ID is: ' + id);
    });

    enum MessageType {
        Snapshot = 0,

    }

    function host(){
        console.log("hi");
        setIsHost(true);

        spawnStaticCube(world);
        
        peer.on('connection', function(conn) {
            console.log("user joined my room: ",conn.connectionId)

            conn.on('open', function() {
                let snap = world.createSnapshot();
                console.log("snapshot sending" ,snap)
                conn.send({
                    type: MessageType.Snapshot,
                    data: snap,
                })
            });
            
            conn.on('data', function(data){
                // Will print 'hi!'
                console.log(conn.connectionId," says ", data);
            });
        });
    }

    function joinRoom(){
        setIsClient(true);
        console.log(roomCode())
        var conn = peer.connect(roomCode());
        conn.on('open', function() {
            // Receive messages
            conn.on('data', function(data: any) {
              console.log('Received', data);

              if(data.type == MessageType.Snapshot){
                console.log('Received snapshot', data.data);
                // world.reset();
                // world = createWorld({ snapshot: data.data });
                applySnapShot(data.data)
              }

            });
        
            // Send messages
            conn.send('Hey i just joined! ' + peer.id);
        });
    }

    const name = 'world';
    // const sayHi = (isHost: boolean, isClient: boolean, peer: Peer, _roomCode: string) => html`
    //     <button @click=${spawn}>Spawn Cube</button>
    //     <button @click=${host} ?disabled=${() => isHost() || isClient()} > ${ () => isHost() ? "Hosting" : "Host a match"}</button>
    //     ${ isHost ? "Room code: " + peer.id : ""}
    //     <input .value=${roomCode} placeholder="Room to join"></input>
    //     <button @click=${joinRoom} ?disabled=${isHost() || isClient()} > ${ isHost? "Hosting" : "Join a match"}</button>

    // `;

    
    const App = () => {

        return html`
            <button onClick=${spawn}>Spawn Cube</button>
            <button onClick=${host} disabled=${() => (isHost() || isClient())}>
                ${ () => (isHost() ? "Hosting" : "Host a match")} 
            </button>
            ${ () => {return isHost() ? "Room code: " + peer.id : ""}}
            <input  value=${() => roomCode()}
            onInput=${(e) => setRoomCode(e.target.value) } />
            <button 
                onClick=${() => joinRoom()} 
                disabled=${() => (isHost() || isClient())}
            >
                ${ () => (isClient() ? "In match" : "Join a match")}
            </button>
        `;

      };
    
    render(App, appRoot);
    
    // document.body.prepend(button)
}