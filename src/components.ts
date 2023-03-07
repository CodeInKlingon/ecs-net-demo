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
  
export const Mesh = j.value<number>();

export const RigidBody = j.value<number>();

export const Bundle = j.value<string>();

export const SpinningBox = j.tag();

// export const Replicate = j.value<j.QueryTerms[]>();
export const Replicate = j.value<j.Singleton<any>[]>()
