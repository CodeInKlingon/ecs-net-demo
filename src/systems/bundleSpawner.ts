import { createQuery, World, useMonitor, component } from "@javelin/ecs";
import { Bundle } from "../schemas";
import { bundleMap } from "../setup/prefab";

const bundles = createQuery(Bundle)

//bundle managemnet system. spawns and de spawns entities with bundle components using a monitor
export const bundleSpawner = (world: World) => {

    useMonitor(
        bundles,
        (entity, [bundleComponent]) => {

            if( bundleMap.has(bundleComponent.id) ){
                let bundle = bundleMap.get(bundleComponent.id)
                bundle?.create(world,entity);
            }else{
                console.log("tried to spawn a bundle but couldn't find the definition")
            }
        },
        (e, [bundleComponent]) => {
            if( bundleMap.has(bundleComponent.id) ){
                let bundle = bundleMap.get(bundleComponent.id)
                bundle?.destroy(world, e);
            }
        }, // entity no longer matches query `spooky`
      )

}

export function attachOrSetComponent(world: World, entity: number, comp: any, value: any){
    let c = world.tryGet(entity, comp)
    if(c){
        console.log("while spawning a bundle. encountered an entity which already has the component we need. set the new value", comp)
        c = value;
    } else {
        console.log("while spawning bundle. entity doesn't have this component yet", comp)
        let c = component(comp, value)
        world.attach(entity, c)
    }
}