import { ComponentType, Entity, System, World, component, field, system } from "@lastolivegames/becsy";
import { ThreeRenderSystem } from "./systems/threeRenderSystem";
import { addOrSetComponent } from "./bundle";
import THREE from "three";
import {Peer, DataConnection} from "peerjs";

type peerId = string;
type serializedComponent = {
    type: ComponentType<any>,
    value?: any
}
export const MessageType = {
    ActionBroadcast: 'ActionBroadcast',
    ActionRequest: 'ActionRequest',
    NetworkSync: 'NetworkSync',
} as const;

type message = Map<remoteEntityId, serializedComponent[]>

type localEntityId = number;
type remoteEntityId = number;

const entityLookUp = new Map<{remoteEntityId: remoteEntityId, peerId: peerId}, Entity>();

export function crateLocalEntity(){}
export function removeLocalEntity(){}
export function broadcastToAll(){}

@component
export class Replicated {
	// /** The peer who has authority over this entity */
	// @field.dynamicString(50) declare peerWithAuthority: string;
	// /** The entity id for this entity according to the authoratative peer */
	// @field.dynamicString(50) declare id: string;
	@field.object declare components: ComponentType<any>[];
}

@component
export class HasLocalAuthority{}

@system(s => s.after(ThreeRenderSystem))
export class NetworkSyncReader extends System {
    
    declare lastIntervalTime: number;
    declare intervalRate: number;

    private entities = this.query(
		q => q.current.and.addedChangedOrRemoved.with(Replicated).and.with(HasLocalAuthority).usingAll.read);

    constructor(){
        super();
        this.intervalRate = 50;
        this.lastIntervalTime = this.time;
    }

    private get interval() : boolean {
        return this.time - this.lastIntervalTime >= this.intervalRate;
    }
    
    execute(): void {
        if(!this.interval) return;
        this.lastIntervalTime = this.time;
        console.log("send sync");
		
        let packet: message = new Map();

        for (const entity of this.entities.current) {
            let componentTypesToSerialize = entity.read(Replicated).components;
            const messageData: serializedComponent[] = []
            for( const compType of componentTypesToSerialize) {

                //only include component in message if entity has it attached
                /**
                 * This functionality allows for a component type to be marked for synchronization 
                 * but its precense is not always required. 
                 * ex: a tag component when a state is true
                 */
                if(!entity.has(compType)) continue;


				let val: Record< string, any> | undefined = undefined;
                if(compType.schema){
                    val = {};
                    Object.keys(compType.schema!).forEach( (key: string) => {
                        val![key] = entity.read(compType)[key]
                    });
                }
                
                messageData.push({
                    type: compType,
                    value: val
                })
			}
            packet.set(entity.__id, messageData)
        }

        //TODO: send packet to peers
        
    }
}


const messagesReceived = new Map<peerId, message>();

@system(s => s.after(NetworkSyncReader))
export class NetworkSyncWriter extends System {

    private entities = this.query(
		q => q.current.added.and.removed.with(Replicated).write.and.without(HasLocalAuthority).usingAll.write);

    execute(): void {
        //copy messages to local variable
        const msgReceived = new Map<peerId, message>([...messagesReceived]);
        // Clear global message queue
        messagesReceived.clear();

        for( const [peerId, messages] of msgReceived){
        
            for(const [remoteEntityId, comps] of messages){
                
                if(!entityLookUp.has({remoteEntityId, peerId})) {
                    console.warn("no local entity found for message", remoteEntityId);
                    continue;
                }

                const entity = entityLookUp.get({remoteEntityId, peerId})!;

                if(!entity.alive){
                    console.warn("local entity for message no longer alive", remoteEntityId);
                    continue;
                }

                const currentReplicatedComponents = entity.read(Replicated).components
            
                for(const comp of comps){
                    
                    const compIndex = currentReplicatedComponents.indexOf(comp.type)
                    if(!!compIndex){
                        currentReplicatedComponents.splice(compIndex, 1)
                    }
                    //@ts-ignore
                    addOrSetComponent(entity, comp.type, comp.value)
                }

                //updates local replicated component to have correct components marked
                entity.write(Replicated).components = comps.map(c => c.type);

                for( const comp of currentReplicatedComponents){
                    entity.remove(comp)
                }

            }
        }

    }
}

@system(s => s.after(NetworkSyncWriter))
export class NetworkSyncInitializer extends System {
    
    declare waitForInitilization: boolean;
    
    
    public get peerLength() : number {
        //TODO: implement peer length check
        return 0;
    }
    
    constructor(){
        super();
        this.waitForInitilization = false;
        this.query(
            q => q.usingAll.write);
    }

    execute(): void {
        if(!this.waitForInitilization) return
    
        if(messagesReceived.size <= this.peerLength) return;

        const msgReceived = new Map<peerId, message>([...messagesReceived]);
        // Clear global message queue
        messagesReceived.clear();

        for(const [peerId, message] of msgReceived){
            for (const [remoteEntityId, comps] of message){
                const entity = this.createEntity();
                entity.add(Replicated, {components: comps.map(c => c.type)});
                for(const comp of comps){
                    //@ts-ignore
                    addOrSetComponent(entity, comp.type, comp.value)
                }

                // Add to entity look up 
                entityLookUp.set({remoteEntityId, peerId}, entity.hold())

            }
        }

        this.waitForInitilization = false;
    }

}


export const rpcDictionary = new Map<number, ( system: System, args: any) => { broadcast: boolean, args: any}>();

export function defineRPC<T>( callback: (system: System, args: T) => { broadcast: boolean, args: T} ){
	let id = rpcDictionary.size + 1;
	rpcDictionary.set(id, callback);
	return (targetRemote: string, args: T) => enqueueRPC(targetRemote, id, args )
}

export const rpcQueue: {targetRemote: string, actionId: number, args: any}[] = [];
export function enqueueRPC<T>(targetRemote: string, actionId: number, args: T){
	rpcQueue.push({
        targetRemote: targetRemote,
		actionId: actionId,
		args: args
    });
}


//Example
// const rpcSpawnCar = defineRPC((system, args: {carPosition: THREE.Vector3, remoteEntityId?: number}) => {
    
//     const entity = system.createEntity();
//     if(!args.remoteEntityId){
//         args.remoteEntityId = entity.__id;
//     }
//     return { broadcast: true, args}
// })

// const myId = "1234";
// rpcSpawnCar( myId, {carPosition: new THREE.Vector3(1,1,1)})

@system
export class NetworkActionRunner extends System {

    public get peers(): DataConnection[] {
        return [];
    }

    public get peerId() : string {
        return ""
    }
    
    
    isRemote(remoteID: string) : boolean {
        //TODO: define is host
        return remoteID == this.peerId;
    }
    

    execute(): void {
        
        const queue = rpcQueue.splice(0,rpcQueue.length);

        for( const actionInQueue of queue){
    
            if(this.isRemote(actionInQueue.targetRemote)){
                
                let action = rpcDictionary.get(actionInQueue.actionId);
                let result = action!(this, actionInQueue.args);

                console.log("ran action locally with result of", result.args)
                if(result.broadcast){
                        this.peers.forEach((conn) => {
                            console.log("send to conn");
                            conn.send({
                                type: MessageType.ActionBroadcast,
                                data: {
                                    actionId: actionInQueue.actionId,
                                    context: result.args
                                }
                            })
                        });
                }
            }else{

                const remote = this.peers.find(p => p.connectionId == actionInQueue.targetRemote)
                if(!remote) {
                    console.warn("peer for action no longer available")
                    continue;
                }
                remote.send({
                    type: MessageType.ActionRequest,
                    data: {
                        actionId: actionInQueue.actionId,
                        context: actionInQueue.args
                    }
                })
            }
        }
    
    }
}