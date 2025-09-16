function normaliseNode(node) {
  const connections = Array.isArray(node.connections) ? Array.from(new Set(node.connections)) : [];
  return {
    id: node.id,
    name: node.name ?? node.id,
    province: node.province ?? 'Unknown',
    description: node.description ?? '',
    biome: node.biome ?? 'road',
    tags: Array.isArray(node.tags) ? node.tags : [],
    eventTags: Array.isArray(node.eventTags) ? node.eventTags : [],
    connections,
    rewards: node.rewards ?? {},
  };
}

export class NodeGraph {
  constructor(data) {
    if (!data || !Array.isArray(data.nodes)) {
      throw new Error('Invalid graph data.');
    }

    this.startNodeId = data.start ?? data.nodes[0]?.id;
    this.nodes = new Map();

    data.nodes.forEach((node) => {
      const normalised = normaliseNode(node);
      this.nodes.set(normalised.id, normalised);
    });

    this.ensureConnectionsSymmetric();
  }

  ensureConnectionsSymmetric() {
    for (const node of this.nodes.values()) {
      node.connections.forEach((connectionId) => {
        const target = this.nodes.get(connectionId);
        if (!target) {
          return;
        }
        if (!target.connections.includes(node.id)) {
          target.connections.push(node.id);
        }
      });
    }
  }

  getStartNodeId() {
    return this.startNodeId;
  }

  getNode(id) {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error(`Node ${id} does not exist.`);
    }
    return node;
  }

  getNeighbors(id) {
    const node = this.getNode(id);
    return node.connections.map((neighborId) => this.getNode(neighborId));
  }

  listNodes() {
    return Array.from(this.nodes.values());
  }

  describeRoute(fromId, toId) {
    const from = this.getNode(fromId);
    const to = this.getNode(toId);
    return `${from.name} → ${to.name}`;
  }
}
