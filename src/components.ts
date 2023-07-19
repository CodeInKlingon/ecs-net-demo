import { component, field} from "@lastolivegames/becsy";

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


//This is esentially just a tag. So I can find this specific object later
@component
export class SpinningCube {}

