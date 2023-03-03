import { createQuery, World } from "@javelin/ecs";
import * as THREE from "three";
import { camera, renderer, scene } from "../main";
import { Position, Rotation, Mesh } from "../schemas";

const objects = createQuery(Position, Rotation, Mesh)

export default (_world: World) => {

    //apply component translation to three objects
    objects((_entity, [position, rotation, id]) => {
        let object = scene.getObjectById(id.id);

        if(!object) return;

        object?.position.set(position.x, position.y, position.z)
        object?.setRotationFromQuaternion( new THREE.Quaternion(rotation!.x, rotation!.y, rotation!.z, rotation!.w))
    });

	renderer.render( scene, camera );

}