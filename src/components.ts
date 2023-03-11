import * as j from '@javelin/ecs';

export const Rotation = j.value<{
    x: number,
    y: number,
    z: number,
    w: number,
}>();
  
export const Position = j.value<{
    x: number,
    y: number,
    z: number,
}>();

export const Velocity = j.value<{
    x: number,
    y: number,
    z: number,
}>();
  
export const Mesh = j.value<number>();

export const RigidBody = j.value<number>();

export const Bundle = j.value<string>();
export const Bundle2 = j.value("f64");

export const HasLocalAuthority = j.tag();
export const Player = j.tag();
export const SpinningBox = j.tag();

// export const Replicate = j.value<j.QueryTerms[]>();
export const Replicate = j.value<{
    hostEntity: j.Entity| undefined,
    components: j.Singleton<any>[],
    peerWithAuthority?: string
}>()
