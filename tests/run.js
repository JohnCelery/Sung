import assert from 'node:assert/strict';
import { GameState } from '../systems/state.js';
import { clearJSONCache } from '../systems/jsonLoader.js';

async function testDeterministicRng() {
  const stateA = new GameState({ storageKey: 'ct-test-a' });
  await stateA.bootstrap();
  stateA.clearSave();
  stateA.startNewRun({ seed: 123456, vehicleId: 'prairie-cruiser' });

  const samplesA = [stateA.nextFloat(), stateA.nextFloat(), stateA.nextFloat()];

  stateA.clearSave();

  const stateB = new GameState({ storageKey: 'ct-test-b' });
  await stateB.bootstrap();
  stateB.clearSave();
  stateB.startNewRun({ seed: 123456, vehicleId: 'prairie-cruiser' });
  const samplesB = [stateB.nextFloat(), stateB.nextFloat(), stateB.nextFloat()];

  assert.deepEqual(samplesA, samplesB, 'RNG sequences should match for identical seeds.');

  stateB.clearSave();
}

async function testSaveAndResume() {
  const key = 'ct-test-save';
  const state1 = new GameState({ storageKey: key });
  await state1.bootstrap();
  state1.clearSave();
  state1.startNewRun({ seed: 98765, vehicleId: 'rocky-hauler' });

  state1.nextFloat();
  state1.nextFloat();
  state1.modifyResource('gas', -2);
  const snapshot = JSON.parse(JSON.stringify(state1.run));

  const state2 = new GameState({ storageKey: key });
  await state2.bootstrap();
  assert(state2.hasActiveRun(), 'Resumed state should detect an active run.');
  assert.deepEqual(state2.run.resources, snapshot.resources, 'Resources should persist across reload.');

  const resumedValue2 = state2.nextFloat();
  const resumedValue1 = state1.nextFloat();
  assert(Math.abs(resumedValue1 - resumedValue2) < 1e-12, 'RNG should resume from saved state.');

  state1.clearSave();
  state2.clearSave();
}

async function run() {
  try {
    await testDeterministicRng();
    await testSaveAndResume();
    console.log('All Canadian Trail smoke tests passed.');
  } catch (error) {
    console.error('Tests failed:', error);
    process.exitCode = 1;
  } finally {
    clearJSONCache();
  }
}

run();
