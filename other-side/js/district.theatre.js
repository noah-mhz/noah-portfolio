/*
 * Neon District · the building's entrance, choreographed in Theatre.js.
 * One sheet ("Building"), one object ("Entrance") with a value per floor (0 = still above, 1 = settled) and a
 * swing (how far the building turns as it lands). The keyframes below are Theatre's saved project state.
 * To edit them visually, open /other-side/?studio#neon: the Theatre studio loads, scrub or move the keyframes,
 * then export the project from the studio and paste the JSON over STATE.
 */
const kf = (id, position, value, handles) => ({ id, position, connectedRight: true, handles, type: 'bezier', value });
const OUT = [0.5, 1, 0.215, 0.61], IN = [0.355, 1, 0.5, 0];       // ease-out cubic between a pair of keys
const track = (name, keys) => ({ type: 'BasicKeyframedTrack', __debugName: name, keyframes: keys });
const floor = (k) => {
  const t = +(.09 * (3 - k)).toFixed(2);                            // the bottom floor lands first, the top floor last
  return track(`Entrance:["f${k}"]`, [kf(`f${k}a`, t, 0, OUT), kf(`f${k}b`, +(t + .7).toFixed(2), 1, IN)]);
};

export const STATE = {
  sheetsById: {
    Building: {
      staticOverrides: { byObject: {} },
      sequence: {
        subUnitsPerUnit: 30, length: 1.4, type: 'PositionalSequence',
        tracksByObject: {
          Entrance: {
            trackData: { f0: floor(0), f1: floor(1), f2: floor(2), f3: floor(3),
              sw: track('Entrance:["swing"]', [kf('swa', 0, .22, OUT), kf('swb', 1.2, 0, IN)]) },
            trackIdByPropPath: { '["f0"]': 'f0', '["f1"]': 'f1', '["f2"]': 'f2', '["f3"]': 'f3', '["swing"]': 'sw' },
          },
        },
      },
    },
  },
  definitionVersion: '0.4.0',
  revisionHistory: ['neon-entrance-1'],
};

export async function load() {
  // ?studio loads one bundle with core and the studio together (they must share one copy of Theatre's internals)
  const editing = new URLSearchParams(location.search).has('studio');
  const lib = await import(editing ? '/other-side/vendor/theatre-studio.mjs' : '/other-side/vendor/theatre-core.mjs');
  const { getProject, types } = lib;
  if (editing) lib.studio.initialize();
  const project = getProject('Neon District', { state: STATE });
  const sheet = project.sheet('Building');
  const r = { range: [0, 1] };
  const obj = sheet.object('Entrance', {
    f0: types.number(1, r), f1: types.number(1, r), f2: types.number(1, r), f3: types.number(1, r),
    swing: types.number(0, { range: [-.6, .6] }),
  });
  await project.ready;
  return { obj, seq: sheet.sequence };
}
