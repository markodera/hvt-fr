// SPDX-License-Identifier: Apache-2.0
export const LOCK_COLS = 44;
export const LOCK_ROWS = 34;

const RAMP = ' .:-=+*#%@';
const CYCLE_SECONDS = 6;
const CAMERA_DISTANCE = 5;
const CAMERA_PITCH = 0.32;
const TARGET_Y = -0.14;
const VIEW_HALF_HEIGHT = 1.5;
const FLOOR_Y = -1.12;
const SHACKLE_RADIUS = 0.46;
const SHACKLE_THICKNESS = 0.095;
const SHACKLE_BASE_Y = 0.3;
const SHACKLE_LIFT = 0.3;
const SHACKLE_SWING = 1.2;
const BOUND_Y = 0.11;
const BOUND_RADIUS = 1.38;
const FRONT_YAW = 0.6;
const FRONT_TIME = 3.7;
const TURN_EASE = 0.8;

function normalize(x, y, z) {
    const length = Math.hypot(x, y, z);
    return [x / length, y / length, z / length];
}

const [KEY_X, KEY_Y, KEY_Z] = normalize(-0.55, 0.75, -0.65);
const [FILL_X, FILL_Y, FILL_Z] = normalize(0.8, 0.15, -0.45);

let liftY = 0;
let swingCos = 1;
let swingSin = 0;
let keyX = KEY_X;
let keyZ = KEY_Z;
let fillX = FILL_X;
let fillZ = FILL_Z;

function clamp01(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
}

function smooth(value) {
    const x = clamp01(value);
    return x * x * (3 - 2 * x);
}

export function shackleState(time) {
    const t = ((time % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS;
    return {
        lift: smooth((t - 2.2) / 0.4) * (1 - smooth((t - 4.9) / 0.35)),
        swing: smooth((t - 2.6) / 0.5) * (1 - smooth((t - 4.4) / 0.5)),
    };
}

// One full turn per cycle, slowed almost to a stop facing the camera while the shackle is open.
function yawAt(time) {
    const turn = (2 * Math.PI * (time - FRONT_TIME)) / CYCLE_SECONDS;
    return FRONT_YAW + turn - TURN_EASE * Math.sin(turn);
}

function keyholeDistance(x, y, z) {
    const circleY = y + 0.26;
    const circle = Math.sqrt(x * x + circleY * circleY) - 0.12;
    const slotX = Math.abs(x) - 0.05;
    const slotY = Math.abs(y + 0.44) - 0.16;
    const outX = slotX > 0 ? slotX : 0;
    const outY = slotY > 0 ? slotY : 0;
    const slot = Math.sqrt(outX * outX + outY * outY) + Math.min(Math.max(slotX, slotY), 0);
    return Math.max(Math.min(circle, slot), Math.abs(z + 0.3) - 0.1);
}

function bodyDistance(x, y, z) {
    const qx = Math.abs(x) - 0.62;
    const qy = Math.abs(y + 0.38) - 0.45;
    const qz = Math.abs(z) - 0.2;
    const outX = qx > 0 ? qx : 0;
    const outY = qy > 0 ? qy : 0;
    const outZ = qz > 0 ? qz : 0;
    const box = Math.sqrt(outX * outX + outY * outY + outZ * outZ) + Math.min(Math.max(qx, qy, qz), 0) - 0.1;
    return Math.max(box, -keyholeDistance(x, y, z));
}

function shackleDistance(x, y, z) {
    const axisX = x + SHACKLE_RADIUS;
    const px = axisX * swingCos + z * swingSin - SHACKLE_RADIUS;
    const pz = z * swingCos - axisX * swingSin;
    const py = y - liftY - SHACKLE_BASE_Y;

    let distance = Infinity;
    if (py > 0) {
        const ring = Math.sqrt(px * px + py * py) - SHACKLE_RADIUS;
        distance = Math.sqrt(ring * ring + pz * pz);
    }

    const leftX = px + SHACKLE_RADIUS;
    const leftY = py > 0 ? py : py < -0.62 ? py + 0.62 : 0;
    distance = Math.min(distance, Math.sqrt(leftX * leftX + leftY * leftY + pz * pz));

    const rightX = px - SHACKLE_RADIUS;
    const rightY = py > 0 ? py : py < -0.3 ? py + 0.3 : 0;
    distance = Math.min(distance, Math.sqrt(rightX * rightX + rightY * rightY + pz * pz));

    return distance - SHACKLE_THICKNESS;
}

function sceneDistance(x, y, z) {
    const boundY = y < -0.55 ? y + 0.55 : y > 0.85 ? y - 0.85 : 0;
    const bound = Math.sqrt(x * x + boundY * boundY + z * z) - 1;
    if (bound > 0.25) {
        return bound;
    }
    return Math.min(bodyDistance(x, y, z), shackleDistance(x, y, z));
}

function shade(x, y, z, dx, dy, dz) {
    const e = 0.0015;
    const a = sceneDistance(x + e, y - e, z - e);
    const b = sceneDistance(x - e, y - e, z + e);
    const c = sceneDistance(x - e, y + e, z - e);
    const d = sceneDistance(x + e, y + e, z + e);
    let nx = a - b - c + d;
    let ny = -a - b + c + d;
    let nz = -a + b - c + d;
    const normalLength = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= normalLength;
    ny /= normalLength;
    nz /= normalLength;

    const key = Math.max(0, nx * keyX + ny * KEY_Y + nz * keyZ);
    const fill = Math.max(0, nx * fillX + ny * FILL_Y + nz * fillZ);
    const hx = keyX - dx;
    const hy = KEY_Y - dy;
    const hz = keyZ - dz;
    const halfLength = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
    const specular = Math.max(0, (nx * hx + ny * hy + nz * hz) / halfLength) ** 28;
    const rim = (1 - Math.max(0, -(nx * dx + ny * dy + nz * dz))) ** 3;
    const metal = shackleDistance(x, y, z) < bodyDistance(x, y, z);

    let light = 0.06 + 0.66 * key + 0.26 * fill + (metal ? 0.75 : 0.45) * specular + 0.2 * rim;
    if (keyholeDistance(x, y, z) < 0.012) {
        light *= 0.22;
    }
    return light;
}

function floorShadow(worldX, worldZ, cosYaw, sinYaw) {
    const x = worldX * cosYaw - worldZ * sinYaw;
    const z = worldX * sinYaw + worldZ * cosYaw;
    const qx = Math.abs(x) - 0.62;
    const qz = Math.abs(z) - 0.2;
    const outX = qx > 0 ? qx : 0;
    const outZ = qz > 0 ? qz : 0;
    const distance = Math.sqrt(outX * outX + outZ * outZ) + Math.min(Math.max(qx, qz), 0) - 0.1;
    return distance < 0.04 ? ':' : distance < 0.18 ? '.' : ' ';
}

export function renderLockFrame(time, cellAspect = 0.6) {
    const { lift, swing } = shackleState(time);
    liftY = lift * SHACKLE_LIFT;
    swingCos = Math.cos(swing * SHACKLE_SWING);
    swingSin = Math.sin(swing * SHACKLE_SWING);

    const yaw = yawAt(time);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    keyX = KEY_X * cosYaw - KEY_Z * sinYaw;
    keyZ = KEY_X * sinYaw + KEY_Z * cosYaw;
    fillX = FILL_X * cosYaw - FILL_Z * sinYaw;
    fillZ = FILL_X * sinYaw + FILL_Z * cosYaw;

    const sinPitch = Math.sin(CAMERA_PITCH);
    const cosPitch = Math.cos(CAMERA_PITCH);
    const camY = TARGET_Y + CAMERA_DISTANCE * sinPitch;
    const camZ = -CAMERA_DISTANCE * cosPitch;
    const originX = -camZ * sinYaw;
    const originZ = camZ * cosYaw;
    const boundOffsetY = camY - BOUND_Y;
    const boundC = originX * originX + boundOffsetY * boundOffsetY + originZ * originZ - BOUND_RADIUS * BOUND_RADIUS;
    const focal = CAMERA_DISTANCE / VIEW_HALF_HEIGHT;
    const halfWidth = (LOCK_COLS * cellAspect) / LOCK_ROWS;

    let output = '';
    for (let row = 0; row < LOCK_ROWS; row += 1) {
        const screenY = 1 - ((row + 0.5) / LOCK_ROWS) * 2;
        for (let col = 0; col < LOCK_COLS; col += 1) {
            const screenX = (((col + 0.5) / LOCK_COLS) * 2 - 1) * halfWidth;
            let wx = screenX;
            let wy = cosPitch * screenY - sinPitch * focal;
            let wz = cosPitch * focal + sinPitch * screenY;
            const rayLength = Math.sqrt(wx * wx + wy * wy + wz * wz);
            wx /= rayLength;
            wy /= rayLength;
            wz /= rayLength;

            const dx = wx * cosYaw - wz * sinYaw;
            const dz = wx * sinYaw + wz * cosYaw;
            const b = originX * dx + boundOffsetY * wy + originZ * dz;
            const discriminant = b * b - boundC;

            let char = ' ';
            let hit = false;
            if (discriminant > 0) {
                const root = Math.sqrt(discriminant);
                const far = -b + root;
                let t = Math.max(0, -b - root);
                for (let step = 0; step < 64 && t < far; step += 1) {
                    const x = originX + dx * t;
                    const y = camY + wy * t;
                    const z = originZ + dz * t;
                    const distance = sceneDistance(x, y, z);
                    if (distance < 0.002) {
                        const light = shade(x, y, z, dx, wy, dz);
                        char = RAMP[1 + Math.min(RAMP.length - 2, Math.floor(clamp01(light) * (RAMP.length - 1)))];
                        hit = true;
                        break;
                    }
                    t += distance;
                }
            }

            if (!hit && wy < 0) {
                const floorT = (FLOOR_Y - camY) / wy;
                char = floorShadow(wx * floorT, camZ + wz * floorT, cosYaw, sinYaw);
            }
            output += char;
        }
        if (row < LOCK_ROWS - 1) {
            output += '\n';
        }
    }
    return output;
}
