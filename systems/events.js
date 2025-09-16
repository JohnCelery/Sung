function normaliseChoice(choice, index) {
  return {
    id: choice.id ?? `choice-${index}`,
    label: choice.label ?? 'Continue',
    description: choice.description ?? '',
    requires: Array.isArray(choice.requires) ? choice.requires : [],
    effects: Array.isArray(choice.effects) ? choice.effects : [],
    outcome: choice.outcome ?? '',
  };
}

function normaliseEvent(event) {
  return {
    id: event.id,
    title: event.title ?? 'Event',
    description: event.description ?? '',
    tags: Array.isArray(event.tags) ? event.tags : ['generic'],
    requires: Array.isArray(event.requires) ? event.requires : [],
    once: Boolean(event.once ?? false),
    chance: typeof event.chance === 'number' ? Math.max(0, Math.min(1, event.chance)) : 0.7,
    weight: typeof event.weight === 'number' ? Math.max(0, event.weight) : 1,
    icon: event.icon ?? null,
    choices: Array.isArray(event.choices)
      ? event.choices.map((choice, index) => normaliseChoice(choice, index))
      : [normaliseChoice({}, 0)],
  };
}

function compare(value, target, operator = '>=') {
  switch (operator) {
    case '>':
      return value > target;
    case '>=':
      return value >= target;
    case '<':
      return value < target;
    case '<=':
      return value <= target;
    case '===':
      return value === target;
    case '!==':
      return value !== target;
    default:
      return value >= target;
  }
}

function meetsRequirement(requirement, state) {
  if (!state?.run) {
    return false;
  }

  switch (requirement.type) {
    case 'resource': {
      const value = state.run.resources[requirement.resource] ?? 0;
      const target = requirement.value ?? 0;
      const operator = requirement.operator ?? requirement.comparison ?? '>=';
      return compare(value, target, operator);
    }
    case 'flag': {
      const current = state.run.flags?.[requirement.flag];
      if (typeof requirement.value === 'undefined') {
        return Boolean(current);
      }
      return current === requirement.value;
    }
    case 'notFlag': {
      const current = state.run.flags?.[requirement.flag];
      return !current;
    }
    case 'visited': {
      return state.run.visitedNodes.includes(requirement.nodeId);
    }
    case 'node': {
      return state.run.currentNode === requirement.nodeId;
    }
    default:
      return true;
  }
}

function meetsRequirements(requirements, state) {
  return requirements.every((requirement) => meetsRequirement(requirement, state));
}

function matchesTags(event, node) {
  if (!event.tags || event.tags.length === 0) {
    return true;
  }

  if (event.tags.includes('any')) {
    return true;
  }

  const nodeTags = new Set([node.biome, ...(node.eventTags ?? [])].filter(Boolean));
  return event.tags.some((tag) => nodeTags.has(tag) || tag === node.province);
}

function ensureEventsSeen(run) {
  if (!Array.isArray(run.flags.eventsSeen)) {
    run.flags.eventsSeen = [];
  }
  return run.flags.eventsSeen;
}

export class EventEngine {
  constructor(data) {
    this.events = new Map();
    this.state = null;
    if (data) {
      this.load(data);
    }
  }

  load(data) {
    if (!data || !Array.isArray(data.events)) {
      throw new Error('Invalid events data.');
    }

    this.events.clear();
    data.events.forEach((event) => {
      const normalised = normaliseEvent(event);
      this.events.set(normalised.id, normalised);
    });
  }

  attachState(state) {
    this.state = state;
  }

  getEvent(id) {
    return this.events.get(id) ?? null;
  }


  canChoose(event, choiceId, state = this.state) {
    const choice = event.choices.find((option) => option.id === choiceId);
    if (!choice) {
      return false;
    }
    return meetsRequirements(choice.requires, state);
  }

  getEligibleEvents(node, state = this.state) {
    if (!state?.run) {
      return [];
    }

    const seen = new Set(ensureEventsSeen(state.run));

    return Array.from(this.events.values()).filter((event) => {
      if (event.once && seen.has(event.id)) {
        return false;
      }
      if (!matchesTags(event, node)) {
        return false;
      }
      if (!meetsRequirements(event.requires, state)) {
        return false;
      }
      return true;
    });
  }

  drawEventForNode(node, state = this.state) {
    if (!state?.run || state.run.status !== 'in-progress') {
      return null;
    }

    const baseChance = typeof node.eventChance === 'number' ? node.eventChance : 0.75;
    const triggerRoll = state.nextFloat();
    if (triggerRoll > baseChance) {
      return null;
    }

    const pool = this.getEligibleEvents(node, state);
    if (pool.length === 0) {
      return null;
    }

    const totalWeight = pool.reduce((sum, event) => sum + (event.weight || 1), 0);
    let roll = state.nextFloat() * totalWeight;
    let selected = pool[0];
    for (const event of pool) {
      roll -= event.weight || 1;
      if (roll <= 0) {
        selected = event;
        break;
      }
    }

    const seen = ensureEventsSeen(state.run);
    if (!seen.includes(selected.id)) {
      seen.push(selected.id);
      state.persist();
    }

    state.appendLog(`Encountered ${selected.title}.`);
    return selected;
  }

  resolveChoice(event, choiceId, state = this.state) {
    const selectedChoice = event.choices.find((choice) => choice.id === choiceId) ?? event.choices[0];
    if (!selectedChoice) {
      throw new Error(`Event ${event.id} has no choices.`);
    }

    if (!meetsRequirements(selectedChoice.requires, state)) {
      return {
        event,
        choice: selectedChoice,
        applied: [],
        blocked: true,
        message: 'Requirements not met',
      };
    }

    const appliedEffects = [];

    selectedChoice.effects.forEach((effect) => {
      switch (effect.type) {
        case 'resource': {
          const value = effect.delta ?? 0;
          const resource = effect.resource;
          state.modifyResource(resource, value);
          appliedEffects.push({
            type: 'resource',
            resource,
            delta: value,
            result: state.run.resources[resource],
          });
          break;
        }
        case 'flag': {
          const flags = state.run.flags;
          flags[effect.flag] = effect.value ?? true;
          state.persist();
          appliedEffects.push({ type: 'flag', flag: effect.flag, value: flags[effect.flag] });
          break;
        }
        case 'log': {
          if (effect.message) {
            state.appendLog(effect.message);
            appliedEffects.push({ type: 'log', message: effect.message });
          }
          break;
        }
        default:
          appliedEffects.push({ type: effect.type ?? 'unknown' });
          break;
      }
    });

    if (selectedChoice.outcome) {
      state.appendLog(selectedChoice.outcome);
    }

    return {
      event,
      choice: selectedChoice,
      applied: appliedEffects,
      blocked: false,
    };
  }
}
