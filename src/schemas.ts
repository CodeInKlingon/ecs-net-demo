import { component, field, ComponentType} from "@lastolivegames/becsy";

@component 
export class Position {
	@field.float64 declare x: number;
	@field.float64 declare y: number;
	@field.float64 declare z: number;
}

@component
export class Rotation {
	@field.float64 declare x: number
	@field.float64 declare y: number
	@field.float64 declare z: number
	@field.float64 declare w: number
}

@component
export class RigidBody {
	@field.float64 declare handle: number;
};

@component
export class Collider {
	@field.int32 declare handle: number;
}

@component
export class Mesh {
	@field.int32 declare id: number;
}

@component
export class Bundle {
	@field.dynamicString(50) declare id: string;
}

//This is esentially just a tag. So I can find this specific object later
@component
export class SpinningCube {}

@component
export class Replicated {

	/** The peer who has authority over this entity */
	@field.dynamicString(50) declare peerWithAuthority: string;

	/** The entity id for this entity according to the authoratative peer */
	@field.dynamicString(50) declare id: string;

	@field.object declare components: ComponentType<any>[];

}
