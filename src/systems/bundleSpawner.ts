import { createQuery, World, useMonitor, ComponentOf, component } from "@javelin/ecs";
import { Bundle } from "../schemas";
import { bundleMap } from "../setup/prefab";

//bundle managemnet system. spawns and de spawns entities with bundle components using a monitor
export const bundleSpawner = (world: World) => {
    const bundles = createQuery(Bundle)
    bundles((entity, [bundle]) => {
        // console.log("we have a bundle")
    });

    useMonitor(
        bundles,
        (entity, [bundleComponent]) => {
            console.log("spawn bundle", bundleComponent.id)
            if( bundleMap.has(bundleComponent.id) ){
                let bundle = bundleMap.get(bundleComponent.id)
                bundle?.create(world,entity);
            }else{
                console.log("tried to spawn a bundle but couldn't find the definition")
            }
        }, // entity matches query `spooky`
        (entity, [bundleComponent]) => {
            if( bundleMap.has(bundleComponent.id) ){
                let bundle = bundleMap.get(bundleComponent.id)
                bundle?.destroy(world,entity);
            }
        }, // entity no longer matches query `spooky`
      )

}

export function attachOrSetComponent(world: World, entity: number, comp: any, value: any){
    let c = world.tryGet(entity, component(comp))
    console.log(c)
    if(c){
        console.log("spawning a bundle. this bundle already has the component we need. set the new value")
        c = value;
    } else {
        let c = component(comp, value)
        world.attach(entity, c)

    }
}