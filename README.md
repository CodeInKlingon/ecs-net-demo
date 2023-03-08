# Javelin + Threejs + Rapier + Peerjs Demo

This project is a proof of concept for the combination of these js libraries for a networked game.

The game behaviour is implemented using the javelin ecs library with solid-js used for a simple ui. Peerjs allows for players to join matches with eachother. One player picks the host option and is shown their room id. The other player enters that code into the join room text box and clicks join to connect with the host. The host initially sends a snapshot of the ecs world to the joining player so they can start the comunication loop with a world that is synched.


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

## nextStep Function

The `nextStep` function accepts a callback as its parameter. It operates using a double buffer like pattern and a system that executes last step's callbacks and moves the buffers around for next step.

```typescript
world.create();
nextStep(()=>{
    console.log("Entities this step", world.query().length); //1
});
console.log("Entities this step", world.query().length); //0
```