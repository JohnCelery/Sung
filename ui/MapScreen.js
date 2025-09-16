import { focusFirstElement } from '../systems/a11y.js';
import { EventModal } from './EventModal.js';

export class MapScreen {
  constructor() {
    this.root = null;
    this.manager = null;
    this.state = null;
    this.eventModal = null;
  }

  async mount(container, manager, state) {
    this.manager = manager;
    this.state = state;

    if (!state.hasActiveRun()) {
      await this.manager.goToSetup();
      return;
    }

    this.root = document.createElement('section');
    this.root.className = 'screen screen--map';
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-labelledby', 'map-heading');

    container.appendChild(this.root);
    this.render();
    focusFirstElement(this.root);

    this.root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-travel-target]');
      if (button) {
        const targetId = button.dataset.travelTarget;
        this.handleTravel(targetId);
      }
    });

    if (this.state.run?.pendingEvent) {
      const pending = this.state.eventEngine.getEvent(this.state.run.pendingEvent);
      if (pending) {
        this.openEvent(pending);
      }
    }
  }

  render() {
    if (!this.root || !this.state?.run) {
      return;
    }

    const { run } = this.state;
    const currentNode = this.state.graph.getNode(run.currentNode);
    const neighbors = this.state.graph.getNeighbors(run.currentNode);

    const log = run.storyLog
      .slice()
      .reverse()
      .map((entry) => `<li>${entry}</li>`)
      .join('');

    this.root.innerHTML = `
      <header class="screen__header">
        <div>
          <h1 id="map-heading">${currentNode.name}</h1>
          <p class="screen__description">${currentNode.description}</p>
        </div>
        <div class="card">
          <h2 class="screen__description">Seed <code>${run.seed}</code></h2>
          <p class="screen__description">${run.vehicle.name}</p>
        </div>
      </header>
      <div data-map>
        <section class="stack map__nodes" aria-label="Trip status">
          <article class="card" aria-label="Resources">
            <h2>Resources</h2>
            <div class="stack">
              ${this.renderResourceMeter('Gas', 'gas', run.resources.gas, run.maxResources.gas)}
              ${this.renderResourceMeter('Snacks', 'snacks', run.resources.snacks, run.maxResources.snacks)}
              ${this.renderResourceMeter('Ride', 'ride', run.resources.ride, run.maxResources.ride)}
              ${this.renderResourceMeter('Money', 'money', run.resources.money, run.maxResources.money)}
            </div>
          </article>
          <article class="card" aria-label="Travel log">
            <h2>Recent Moments</h2>
            <ul class="map__log">${log}</ul>
          </article>
        </section>
        <aside class="card stack map__travel-options" aria-label="Possible routes">
          <h2>Next Stops</h2>
          <p class="screen__description">Each hop consumes <strong>1 Gas</strong>. Choose wisely.</p>
          ${neighbors
            .map(
              (neighbor) => `
                <button type="button" class="button button--surface" data-travel-target="${neighbor.id}">
                  <span class="stack" style="align-items:flex-start; text-align:left;">
                    <strong>${neighbor.name}</strong>
                    <small class="screen__description">${neighbor.province} &middot; ${neighbor.biome}</small>
                  </span>
                </button>
              `
            )
            .join('')}
          <button type="button" class="button button--secondary" data-back-to-title>Save &amp; Return to Title</button>
        </aside>
      </div>
    `;

    this.root.querySelector('[data-back-to-title]').addEventListener('click', () => {
      this.manager.goToTitle();
    });
  }

  renderResourceMeter(label, key, value, max) {
    const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    return `
      <div class="resource-meter" data-resource="${key}">
        <div>
          <div class="resource-meter__label">${label}</div>
          <div class="resource-meter__value">${value} / ${max}</div>
        </div>
        <div class="resource-meter__bar" role="presentation">
          <div class="resource-meter__fill" style="transform: scaleX(${ratio});"></div>
        </div>
      </div>
    `;
  }

  handleTravel(targetId) {
    try {
      const event = this.state.travelTo(targetId);
      this.render();
      if (this.state.run?.status === 'finished') {
        this.manager.goToEnd(this.state.run.ending);
        return;
      }
      if (event) {
        this.openEvent(event);
      }
    } catch (error) {
      console.error(error);
    }
  }

  openEvent(event) {
    if (this.eventModal) {
      this.eventModal.close();
    }

    this.eventModal = new EventModal(event, {
      onResolve: (result) => {
        if (result?.blocked) {
          return;
        }
        this.render();
        if (this.state.run?.status === 'finished') {
          this.manager.goToEnd(this.state.run.ending);
        }
      },
      state: this.state,
    });

    this.eventModal.open();
  }

  unmount() {
    if (this.eventModal) {
      this.eventModal.close();
      this.eventModal = null;
    }

    if (this.root) {
      this.root.replaceChildren();
      this.root.remove();
      this.root = null;
    }
  }
}
