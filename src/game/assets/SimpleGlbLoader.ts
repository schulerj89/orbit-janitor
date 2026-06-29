import * as THREE from 'three/webgpu';

type GlbComponentType = 5120 | 5121 | 5122 | 5123 | 5125 | 5126;
type GlbAccessorType = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT4';

interface GlbBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
}

interface GlbAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: GlbComponentType;
  normalized?: boolean;
  count: number;
  type: GlbAccessorType;
}

interface GlbImage {
  bufferView?: number;
  mimeType?: string;
}

interface GlbTexture {
  source?: number;
}

interface GlbMaterial {
  name?: string;
  alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND';
  pbrMetallicRoughness?: {
    baseColorFactor?: [number, number, number, number];
    baseColorTexture?: {
      index: number;
    };
    metallicFactor?: number;
    roughnessFactor?: number;
  };
}

interface GlbPrimitive {
  attributes: Record<string, number>;
  indices?: number;
  material?: number;
  mode?: number;
}

interface GlbMesh {
  name?: string;
  primitives: GlbPrimitive[];
}

interface GlbNode {
  name?: string;
  mesh?: number;
  children?: number[];
  matrix?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
}

interface GlbScene {
  nodes?: number[];
}

interface GlbJson {
  scenes?: GlbScene[];
  scene?: number;
  nodes?: GlbNode[];
  meshes?: GlbMesh[];
  accessors?: GlbAccessor[];
  bufferViews?: GlbBufferView[];
  materials?: GlbMaterial[];
  images?: GlbImage[];
  textures?: GlbTexture[];
}

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;
const MODE_TRIANGLES = 4;

export async function loadSimpleGlb(url: string): Promise<THREE.Group> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load GLB: ${url}`);
  }

  const { json, binaryChunk } = parseGlb(await response.arrayBuffer());
  const materials = await createMaterials(json, binaryChunk);
  const root = new THREE.Group();
  const scene = json.scenes?.[json.scene ?? 0];
  const nodeIds = scene?.nodes ?? json.nodes?.map((_, index) => index) ?? [];

  root.name = `SimpleGlb:${url}`;

  for (const nodeId of nodeIds) {
    root.add(createNode(nodeId, json, binaryChunk, materials));
  }

  return root;
}

function parseGlb(buffer: ArrayBuffer): {
  json: GlbJson;
  binaryChunk: ArrayBuffer;
} {
  const view = new DataView(buffer);
  const magic = view.getUint32(0, true);
  const version = view.getUint32(4, true);

  if (magic !== GLB_MAGIC || version !== 2) {
    throw new Error('Unsupported GLB file.');
  }

  let offset = 12;
  let json: GlbJson | null = null;
  let binaryChunk: ArrayBuffer | null = null;

  while (offset < buffer.byteLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkType === JSON_CHUNK_TYPE) {
      const text = new TextDecoder().decode(buffer.slice(chunkStart, chunkEnd));
      json = JSON.parse(text) as GlbJson;
    } else if (chunkType === BIN_CHUNK_TYPE) {
      binaryChunk = buffer.slice(chunkStart, chunkEnd);
    }

    offset = chunkEnd;
  }

  if (!json || !binaryChunk) {
    throw new Error('GLB file is missing JSON or binary chunks.');
  }

  return { json, binaryChunk };
}

async function createMaterials(
  json: GlbJson,
  binaryChunk: ArrayBuffer
): Promise<THREE.Material[]> {
  const materials = json.materials ?? [];

  if (materials.length === 0) {
    return [
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0.02,
        flatShading: true
      })
    ];
  }

  return Promise.all(
    materials.map(async (material) => {
      const pbr = material.pbrMetallicRoughness;
      const baseColor = pbr?.baseColorFactor ?? [1, 1, 1, 1];
      const meshMaterial = new THREE.MeshStandardMaterial({
        name: material.name,
        color: new THREE.Color(baseColor[0], baseColor[1], baseColor[2]),
        opacity: baseColor[3],
        transparent: material.alphaMode === 'BLEND' || baseColor[3] < 1,
        roughness: pbr?.roughnessFactor ?? 0.86,
        metalness: pbr?.metallicFactor ?? 0.04,
        flatShading: true
      });

      const textureIndex = pbr?.baseColorTexture?.index;
      const textureSource =
        textureIndex === undefined ? undefined : json.textures?.[textureIndex]?.source;

      if (textureSource !== undefined) {
        meshMaterial.map = await createTexture(json, binaryChunk, textureSource);
        meshMaterial.needsUpdate = true;
      }

      return meshMaterial;
    })
  );
}

async function createTexture(
  json: GlbJson,
  binaryChunk: ArrayBuffer,
  imageIndex: number
): Promise<THREE.Texture> {
  const image = json.images?.[imageIndex];

  if (!image || image.bufferView === undefined) {
    throw new Error(`Unsupported GLB image ${imageIndex}.`);
  }

  const bufferView = getBufferView(json, image.bufferView);
  const byteOffset = bufferView.byteOffset ?? 0;
  const bytes = new Uint8Array(binaryChunk, byteOffset, bufferView.byteLength);
  const blob = new Blob([bytes], { type: image.mimeType ?? 'image/png' });
  const texture =
    'createImageBitmap' in window
      ? await createBitmapTexture(blob)
      : await createImageTexture(blob);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

async function createBitmapTexture(blob: Blob): Promise<THREE.Texture> {
  const bitmap = await createImageBitmap(blob);
  return new THREE.Texture(bitmap);
}

function createImageTexture(blob: Blob): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(new THREE.Texture(image));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode GLB texture.'));
    };
    image.src = objectUrl;
  });
}

function createNode(
  nodeIndex: number,
  json: GlbJson,
  binaryChunk: ArrayBuffer,
  materials: THREE.Material[]
): THREE.Object3D {
  const node = json.nodes?.[nodeIndex];

  if (!node) {
    return new THREE.Group();
  }

  const object =
    node.mesh === undefined
      ? new THREE.Group()
      : createMesh(json.meshes?.[node.mesh], json, binaryChunk, materials);

  object.name = node.name ?? object.name;
  applyNodeTransform(object, node);

  for (const childIndex of node.children ?? []) {
    object.add(createNode(childIndex, json, binaryChunk, materials));
  }

  return object;
}

function createMesh(
  glbMesh: GlbMesh | undefined,
  json: GlbJson,
  binaryChunk: ArrayBuffer,
  materials: THREE.Material[]
): THREE.Object3D {
  const group = new THREE.Group();

  group.name = glbMesh?.name ?? 'GLB Mesh';

  for (const primitive of glbMesh?.primitives ?? []) {
    if (primitive.mode !== undefined && primitive.mode !== MODE_TRIANGLES) {
      continue;
    }

    const geometry = new THREE.BufferGeometry();
    const position = primitive.attributes.POSITION;
    const normal = primitive.attributes.NORMAL;
    const uv = primitive.attributes.TEXCOORD_0;

    if (position === undefined) {
      continue;
    }

    geometry.setAttribute('position', createAttribute(json, binaryChunk, position));

    if (normal !== undefined) {
      geometry.setAttribute('normal', createAttribute(json, binaryChunk, normal));
    }

    if (uv !== undefined) {
      geometry.setAttribute('uv', createAttribute(json, binaryChunk, uv));
    }

    if (primitive.indices !== undefined) {
      geometry.setIndex(createAttribute(json, binaryChunk, primitive.indices));
    }

    geometry.computeBoundingSphere();

    if (!geometry.getAttribute('normal')) {
      geometry.computeVertexNormals();
    }

    const material = materials[primitive.material ?? 0] ?? materials[0];
    const mesh = new THREE.Mesh(geometry, material);

    mesh.name = glbMesh?.name ?? 'GLB Primitive';
    group.add(mesh);
  }

  return group.children.length === 1 ? group.children[0] : group;
}

function createAttribute(
  json: GlbJson,
  binaryChunk: ArrayBuffer,
  accessorIndex: number
): THREE.BufferAttribute {
  const accessor = getAccessor(json, accessorIndex);
  const itemSize = getAccessorItemSize(accessor.type);
  const componentSize = getComponentSize(accessor.componentType);
  const bufferView =
    accessor.bufferView === undefined
      ? undefined
      : getBufferView(json, accessor.bufferView);

  if (!bufferView) {
    const emptyArray = new Float32Array(accessor.count * itemSize);
    return new THREE.BufferAttribute(emptyArray, itemSize, accessor.normalized ?? false);
  }

  const expectedStride = itemSize * componentSize;

  if (bufferView.byteStride !== undefined && bufferView.byteStride !== expectedStride) {
    throw new Error('Interleaved GLB accessors are not supported by SimpleGlbLoader.');
  }

  const byteOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const componentCount = accessor.count * itemSize;
  const source = createTypedArray(
    accessor.componentType,
    binaryChunk,
    byteOffset,
    componentCount
  );
  const packed = source.slice();

  return new THREE.BufferAttribute(packed, itemSize, accessor.normalized ?? false);
}

function applyNodeTransform(object: THREE.Object3D, node: GlbNode): void {
  if (node.matrix) {
    object.applyMatrix4(new THREE.Matrix4().fromArray(node.matrix));
    return;
  }

  if (node.translation) {
    object.position.fromArray(node.translation);
  }

  if (node.rotation) {
    object.quaternion.fromArray(node.rotation);
  }

  if (node.scale) {
    object.scale.fromArray(node.scale);
  }
}

function getAccessor(json: GlbJson, index: number): GlbAccessor {
  const accessor = json.accessors?.[index];

  if (!accessor) {
    throw new Error(`Missing GLB accessor ${index}.`);
  }

  return accessor;
}

function getBufferView(json: GlbJson, index: number): GlbBufferView {
  const bufferView = json.bufferViews?.[index];

  if (!bufferView) {
    throw new Error(`Missing GLB buffer view ${index}.`);
  }

  return bufferView;
}

function getAccessorItemSize(type: GlbAccessorType): number {
  switch (type) {
    case 'SCALAR':
      return 1;
    case 'VEC2':
      return 2;
    case 'VEC3':
      return 3;
    case 'VEC4':
      return 4;
    case 'MAT4':
      return 16;
  }
}

function getComponentSize(componentType: GlbComponentType): number {
  switch (componentType) {
    case 5120:
    case 5121:
      return 1;
    case 5122:
    case 5123:
      return 2;
    case 5125:
    case 5126:
      return 4;
  }
}

function createTypedArray(
  componentType: GlbComponentType,
  buffer: ArrayBuffer,
  byteOffset: number,
  length: number
): Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array {
  switch (componentType) {
    case 5120:
      return new Int8Array(buffer, byteOffset, length);
    case 5121:
      return new Uint8Array(buffer, byteOffset, length);
    case 5122:
      return new Int16Array(buffer, byteOffset, length);
    case 5123:
      return new Uint16Array(buffer, byteOffset, length);
    case 5125:
      return new Uint32Array(buffer, byteOffset, length);
    case 5126:
      return new Float32Array(buffer, byteOffset, length);
  }
}
