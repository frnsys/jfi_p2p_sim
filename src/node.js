import * as THREE from 'three';

const materials = {
  peer: new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.2 }),
  sybil: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
  target: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
};
const geometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
	-2.0, -2.0,  2.0,
	 2.0, -2.0,  2.0,
	 2.0,  2.0,  2.0,

	 2.0,  2.0,  2.0,
	-2.0,  2.0,  2.0,
	-2.0, -2.0,  2.0
]);

// itemSize = 3 because there are 3 values (components) per vertex
geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

class Node {
  constructor(type) {
    this.baseType = type;
    this.mesh = new THREE.Mesh(geometry, materials[type]);
  }

  set type(type) {
    this.mesh.material = materials[type];
  }
}

export default Node;
