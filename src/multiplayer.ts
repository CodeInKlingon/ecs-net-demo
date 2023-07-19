import { ComponentType, System, component, field, system } from "@lastolivegames/becsy";
import { ThreeRenderSystem } from "./systems/threeRenderSystem";
import { addOrSetComponent } from "./bundle";

type peerId = string;
type serializedComponent = {
    type: ComponentType<any>,
    value?: any
}
type message = Map<remoteEntityId, serializedComponent[]>

type localEntityId = number;
type remoteEntityId = number;
const entityLookUp = new Map<localEntityId, {remoteEntityId: remoteEntityId, peerId: peerId}>();

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

        for( const entity of this.entities.current){

            if(!entityLookUp.has(entity.__id)) continue;

            const lookUp = entityLookUp.get(entity.__id);
            const messageSender = lookUp!.peerId;
            const remoteEntityId = lookUp!.remoteEntityId;

            const messageForEntity = msgReceived.get(messageSender);
            if(!messageForEntity) continue;
            const syncData = messageForEntity!.get(remoteEntityId)
            if(!syncData) continue;

            const currentReplicatedComponents = entity.read(Replicated).components
            
            //apply data from syncData to ent with 
            for(const comp of syncData){
                
                const compIndex = currentReplicatedComponents.indexOf(comp.type)
                if(!!compIndex){
                    currentReplicatedComponents.splice(compIndex, 1)
                }
                //@ts-ignore
                addOrSetComponent(entity, comp.type, comp.value)
            }

            //updates local replicated component to have correct components marked
            entity.write(Replicated).components = syncData.map(c => c.type);

            for( const comp of currentReplicatedComponents){
                entity.remove(comp)
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
                entityLookUp.set(entity.__id, {remoteEntityId, peerId})

            }
        }

    }

}