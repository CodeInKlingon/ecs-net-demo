import { createQuery, World } from "@javelin/ecs";
import { physicsWorld } from "../main";
import { Position, RigidBody, Rotation, Mesh } from "../schemas";


const bodies = createQuery(Position, Rotation, RigidBody)

export default (world: World) => {
    
    //apply physics transformation to components
    bodies((entity, [position, rotation, rigidbody]) => {
        
        let rb = physicsWorld.getRigidBody(rigidbody.handle);

        if(!rb) return;
        
        position.x = rb.translation().x;
        position.y = rb.translation().y;
        position.z = rb.translation().z;

        rotation.x = rb.rotation().x;
        rotation.y = rb.rotation().y;
        rotation.z = rb.rotation().z;
        rotation.w = rb.rotation().w;

    })
    
    
    physicsWorld.step();
}