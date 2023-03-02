import { string, number } from "@javelin/ecs"

export const Position = {
    x: number,
    y: number,
    z: number
}

export const Rotation = {
    x: number,
    y: number,
    z: number,
    w: number
}


export const RigidBody = {
    handle: number
}

export const Collider = {
    handle: number
}

export const Mesh = {
    id: number
}

export const Bundle = {
    id: string
}

//This is esentially just a tag. So I can find this specific object later
export const SpinningCube = {a: number};