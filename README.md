# Javelin + Threejs + Rapier + Peerjs Demo

This project is a proof of concept for the combination of these js libraries for a networked game.

The game behaviour is implemented using the javelin ecs library with solid-js used for a simple ui. Peerjs allows for players to join matches with eachother. One player picks the host option and is shown their room id. The other player enters that code into the join room text box and clicks join to connect with the host. The host initially sends a snapshot of the ecs world to the joining player so they can start the comunication loop with a world that is synched.

Actions can be defined as functions that are broadcast to each connected player and can be initiated from either host or client.


## Getting started

```
npm i
```


```
npm run dev
```

# Documentation

Table of contents

- [Bundle Component](#bundle-component)
- [Replicate Component](#replicate-component)
- [nextStep Function](#nextstep-function)
- [broadcast Function](#broadcast-function)
## Bundle Component
I'm not fully settled on the word bundles. Bundles allow you to repeatably build up and tear down entities with components and their integrations with 3rd party libraries. 

Bundle definition has two parts: Creation and destruction. 

```typescript
export const My_New_Bundle = defineBundle(
    (world: j.World, entity: j.Entity) => {
        const mesh = new THREE.Mesh();
        scene.add(mesh);
        world.add(entity, Mesh, mesh.id )
    },
    (world: j.World, entity: j.Entity) => {
        const meshId = world.get(entity, Mesh);
        let mesh = scene.getById(meshId);
        scene.remove(mesh);
    },
);
```

Using the bundle

```typescript
world.create(Bundle, My_New_Bundle);
```

How this works behind the scenes: There is a system that has a monitor for new bundle components which uses the Bundle component's value to look up the definition in storage and calls the create function. The create function is deffered until the next world step (see [`nextStep`](##nextStep_Function)) to allow for other components to take priority over the bundle creation code.

### Adding components in a bundle function
There are two functions available to assist in the process of adding components from within a bundle function `addIfNotSet` & `addOrUpdateIfExists`
```typescript
let [position] = addIfNotSet(world, entity, Position, {x: 10, y: 10});
let [rotation] = addOrUpdateIfExists(world, entity, Rotation, {x: 1, y: 0});
```
With `addIfNotSet` the component will be added with the defined value if it doesn't exist on the entity. If the component does exist on the entity it will not be added and the value will not be changed.

With `addOrUpdateIfExists` the component will be added with the defined value if it doesn't exist on the entity. If the component does exist already the value will be updated.

Both functions return the resulting values of the component/type. This is very useful if you need these values later in the function.

Because bundle components modify their entity composition these functions cut down on boilerplate code for common actions. I might want to use `addIfNotSet` on a component like `Position` so that I can customize the position with new instances. ex:
```typescript
world.create(j.type(Bundle, Position), Enemy_Bundle, {x: spawnPoint[i].x, y: spawnPoint[i].y})
```
An example of when you might use `addOrUpdateIfExists` is for a component that should always be set by the content of your bundle function. ex:
```typescript
const mesh = new THREE.Mesh();
addOrUpdateIfExists(world, entity, Mesh, mesh.id);
```


## Replicate Component
The replicate component is used to mark which entities and which of their components you want to have synchronized between clients.

```typescript
let entity = world.create(j.Type(Position, Rotation, Bundle), /**values */);

world.add(entity, Replicate, [Position, Bundle])
//only position and bundle components are marked to be replicated
```
Now you can use a query to gather a list of entities as well as which components to get.

```typescript
const replicatedEnts = world.query(Replicate);
replicatedEnts.each((entity, components) => {
    conts values = components.map( (component) => world.get(ent, component); );
});
```

Currently a loop is configured on the host to send this data to all clients. The clients then use these values to update their local components values. 

## nextStep Function

The `nextStep` function accepts a callback as its parameter. It operates using a double buffer like pattern and a system that executes last step's callbacks and moves the buffers around for next step.

```typescript
world.create();
nextStep(()=>{
    console.log("Entities this step", world.query().length); //1
});
console.log("Entities this step", world.query().length); //0
```

## broadcast Function

The `broadcast` function allows you to define actions and then execute them anywhere in your code and they will be executed by all clients of the game. The action can be initiated by any client as well. This cuts down on a lot of boilerplate code needing to be created.

Actions are defined like so:
```typescript
export const spawnPhysicsBox = broadcast((world, position: {x: number, y: number, z: number}) => {
	console.log("This should happen everywhere", position);
	if(isHost()){
		//host can check for some condition and return false to prevent the action from being broadcast
		// return false;
	}
	world.create( j.type( Bundle, Position), PhysicsBox,  position)
	return true;
})
```
Actions should be defined at global scope to ensure they are accessible at runtime by any client.

And initiated like this:

```typescript
spawnPhysicsBox({x: 0, y: 3, z: 0})
```

Notice the action's callback returns true or false. That is used by the host to control whether the action should be broadcasted to the clients. When a client initiates an action it is actually just asking the host if it can do the action. The host then initiates the action and only broadcasts the action to clients if the action returns true.

Data that is required inside the action from the initiator should be passed in as a parameter. In the example above we pass in a position object. This allows actions to have parameters. 

Its important to note that the action will not neccessarily be completed in the same way by each client. The ecs worlds are not the same.

For example if your action will remove an entity from the world you will need to do two things: tell the action which entity you want to delete using the hosts entity id and second in the action get the local entity id from the entity map using the host entity id you passed in. 

```typescript

export const broadCastDelete = broadcast((world, hostEnt: j.Entity ) => {
	let ent = entityMap.get(hostEnt)
	world.delete(ent!);
	return true;
});

let hostEnt = world.get(entity, Replicate)!.hostEntity
broadCastDelete(hostEnt)
```

The same is true for actions that will modify a specific entity. You will need to use this entity look up map to ensure all clients are targetting the same entity.

The enity map is kept up to date by a system and a monitor using the Replicate component. 

more to come later