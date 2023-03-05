import * as j from '@javelin/ecs';

export const Rotation = j.value({
    x: 'f32',
    y: 'f32',
    z: 'f32',
    w: 'f32',
});
  
export const Position = j.value({
    x: 'f32',
    y: 'f32',
    z: 'f32',
});
  
export const Mesh = j.value<number>();

export const RigidBody = j.value<number>();

export const Bundle = j.value<string>();

export const SpinningBox = j.tag();
export const Replicate = j.value<[]>();
