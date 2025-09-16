import { loadJSON } from './jsonLoader.js';
import { createRNG, hashStringToSeed } from './rng.js';
import { NodeGraph } from './graph.js';
import { EventEngine } from './events.js';

const STORAGE_KEY = 'canadian-trail-save';
const SAVE_VERSION = 1;

const DEFAULT_VEHICLES = [
  {
    id: 'prairie-cruiser',
    name: 'Prairie Cruiser (Minivan)',
    description: 'Balanced stats and a trusty cassette deck for the road.',
    resources: { gas: 8, snacks: 7, ride: 7, money: 6 },
  },
  {
    id: 'rocky-hauler',
    name: 'Rocky Hauler (Pickup)',
    description: 'Extra ride integrity and storage at the cost of snacks.',
    resources: { gas: 7, snacks: 5, ride: 9, money: 7 },
  },
  {
    id: 'great-lakes-shuttle',
    name: 'Great Lakes Shuttle (Microbus)',
    description: 'Room for the whole crew and snacks aplenty, but guzzles gas.',
    resources: { gas: 6, snacks: 9, ride: 6, money: 8 },
  },
];

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

function resolveStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (!globalThis.__CANADIAN_TRAIL_MEMORY_STORAGE__) {
    globalThis.__CANADIAN_TRAIL_MEMORY_STORAGE__ = createMemoryStorage();
  }

  return globalThis.__CANADIAN_TRAIL_MEMORY_STORAGE__;
}

function nowISO() {
  return new Date().toISOString();
}

function clampResource(value, max = 12) {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class GameState {
  constructor(options = {}) {
    this.storageKey = options.storageKey ?? STORAGE_KEY;
    this.storage = resolveStorage();
    this.rng = createRNG(1);
    this.graph = null;
    this.eventEngine = new EventEngine();
    this.contentLoaded = false;
    this.run = null;
    this.log = [];
  }

  async bootstrap() {
    const [nodesData, eventsData] = await Promise.all([
      loadJSON('../data/nodes.json'),
      loadJSON('../data/events.json'),
    ]);

    this.graph = new NodeGraph(nodesData);
    this.eventEngine.load(eventsData);
    this.eventEngine.attachState(this);
    this.contentLoaded = true;

    const existing = this.loadFromStorage();
    if (existing?.run) {
      this.applySave(existing);
    }
  }

  applySave(save) {
    if (!save?.run) {
      return;
    }

    this.run = save.run;
    this.rng = createRNG(this.run.seed);
    if (this.run.rngState) {
      this.rng.setState(this.run.rngState);
    }
  }

  hasContent() {
    return this.contentLoaded;
  }

  getVehicles() {
    return DEFAULT_VEHICLES.map((vehicle) => ({ ...vehicle }));
  }

  static generateSeed() {
    return Math.floor((Date.now() * Math.random()) % 1000000007) + 1;
  }

  static deriveSeedFromString(text) {
    return hashStringToSeed(text);
  }

  loadFromStorage() {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to load save data', error);
      return null;
    }
  }

  persist() {
    if (!this.run) {
      this.storage.removeItem(this.storageKey);
      return;
    }

    const payload = {
      version: SAVE_VERSION,
      run: this.run,
    };

    try {
      this.storage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn('Failed to persist save data', error);
    }
  }

  clearSave() {
    this.run = null;
    try {
      this.storage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear save data', error);
    }
  }

  hasActiveRun() {
    return Boolean(this.run && this.run.status === 'in-progress');
  }

  getSummary() {
    if (!this.run) {
      return null;
    }

    const node = this.graph?.getNode(this.run.currentNode);
    return {
      seed: this.run.seed,
      vehicle: this.run.vehicle,
      resources: deepClone(this.run.resources),
      currentNode: node ? { id: node.id, name: node.name, province: node.province } : null,
      status: this.run.status,
      storyLog: [...(this.run.storyLog ?? [])].slice(-6),
    };
  }

  startNewRun(options = {}) {
    if (!this.graph) {
      throw new Error('GameState has not been bootstrapped.');
    }

    const selectedVehicle = this.getVehicles().find((vehicle) => vehicle.id === options.vehicleId) ??
      this.getVehicles()[0];

    const seed = options.seed ?? GameState.generateSeed();
    const startNodeId = options.startNode ?? this.graph.getStartNodeId();
    const startNode = this.graph.getNode(startNodeId);

    this.rng = createRNG(seed);

    const maxResources = {
      gas: selectedVehicle.resources.gas,
      snacks: selectedVehicle.resources.snacks,
      ride: selectedVehicle.resources.ride,
      money: selectedVehicle.resources.money,
    };

    this.run = {
      version: SAVE_VERSION,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      seed,
      rngState: this.rng.getState(),
      vehicle: selectedVehicle,
      maxResources,
      resources: { ...maxResources },
      currentNode: startNode.id,
      visitedNodes: [startNode.id],
      flags: {},
      storyLog: [`Departed ${startNode.name} with ${selectedVehicle.name}.`],
      pendingEvent: null,
      status: 'in-progress',
      ending: null,
    };

    this.persist();
    return this.run;
  }

  syncRNG() {
    if (!this.run) {
      return;
    }
    this.run.rngState = this.rng.getState();
    this.run.updatedAt = nowISO();
    this.persist();
  }

  nextFloat() {
    const value = this.rng.nextFloat();
    this.syncRNG();
    return value;
  }

  nextRange(min, max) {
    const value = this.rng.nextRange(min, max);
    this.syncRNG();
    return value;
  }

  pick(list) {
    const value = this.rng.pick(list);
    this.syncRNG();
    return value;
  }

  shuffle(list) {
    const value = this.rng.shuffle(list);
    this.syncRNG();
    return value;
  }

  modifyResource(name, delta) {
    if (!this.run) {
      return;
    }

    const current = this.run.resources[name] ?? 0;
    const max = this.run.maxResources[name] ?? 12;
    const nextValue = clampResource(current + delta, max);
    this.run.resources[name] = nextValue;
    this.run.updatedAt = nowISO();
    this.persist();
    return nextValue;
  }

  appendLog(message) {
    if (!this.run) {
      return;
    }
    const entry = `${new Date().toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })}: ${message}`;
    this.run.storyLog.push(entry);
    this.run.storyLog = this.run.storyLog.slice(-32);
    this.persist();
  }

  travelTo(nodeId) {
    if (!this.run) {
      throw new Error('No active run.');
    }

    const currentNode = this.graph.getNode(this.run.currentNode);
    if (!currentNode.connections.includes(nodeId)) {
      throw new Error(`Node ${nodeId} is not reachable from ${currentNode.id}.`);
    }

    const destination = this.graph.getNode(nodeId);
    this.modifyResource('gas', -1);
    this.run.currentNode = destination.id;
    this.run.visitedNodes.push(destination.id);
    this.appendLog(`Cruised into ${destination.name}.`);

    const event = this.eventEngine.drawEventForNode(destination, this);
    if (event) {
      this.run.pendingEvent = event.id;
      this.persist();
    } else {
      this.run.pendingEvent = null;
      this.persist();
    }

    this.checkForFailure();
    return event;
  }

  checkForFailure() {
    if (!this.run) {
      return false;
    }

    const depleted = Object.entries(this.run.resources).filter(([, value]) => value <= 0);
    if (depleted.length > 0) {
      const [resourceName] = depleted[0];
      this.endRun({
        endingId: 'depleted-resource',
        title: 'Run Ended',
        description: `You ran out of ${resourceName}. The trail ends here for now.`,
      });
      return true;
    }
    return false;
  }

  resolvePendingEvent(choiceId) {
    if (!this.run?.pendingEvent) {
      return null;
    }

    const eventId = this.run.pendingEvent;
    const event = this.eventEngine.getEvent(eventId);
    if (!event) {
      this.run.pendingEvent = null;
      this.persist();
      return null;
    }

    const outcome = this.eventEngine.resolveChoice(event, choiceId, this);
    this.run.pendingEvent = null;
    this.persist();
    this.checkForFailure();
    return outcome;
  }

  endRun(result) {
    if (!this.run) {
      return;
    }

    this.run.status = 'finished';
    this.run.ending = result ?? null;
    this.run.updatedAt = nowISO();
    this.persist();
  }
}

export { DEFAULT_VEHICLES };
