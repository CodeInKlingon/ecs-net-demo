import * as j from '@javelin/ecs';
import RAPIER from '@dimforge/rapier3d-compat';
import Peer from 'peerjs';

export const SceneResource = j.resource<THREE.Scene>();
export const CameraResource = j.resource<THREE.PerspectiveCamera>();
export const RendererResource = j.resource<THREE.WebGLRenderer>();
export const PhysicsResource = j.resource<RAPIER.World>();
export const PeerResource = j.resource<Peer>();
