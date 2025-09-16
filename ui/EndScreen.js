import { focusFirstElement } from '../systems/a11y.js';

export class EndScreen {
  constructor(result) {
    this.result = result ?? {
      title: 'Run Complete',
      description: 'Your journey reached a natural conclusion.',
    };
    this.root = null;
    this.manager = null;
    this.state = null;
  }

  async mount(container, manager, state) {
    this.manager = manager;
    this.state = state;

    const summary = state.getSummary();

    this.root = document.createElement('section');
    this.root.className = 'screen screen--end';
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-labelledby', 'ending-heading');

    const resources = summary
      ? Object.entries(summary.resources)
          .map(([key, value]) => this.renderResourceChip(key, value))
          .join('')
      : '';

    this.root.innerHTML = `
      <header class="screen__header">
        <div>
          <h1 id="ending-heading">${this.result.title}</h1>
          <p class="screen__description">${this.result.description}</p>
        </div>
      </header>
      <div class="stack">
        <article class="card">
          <h2>Final Snapshot</h2>
          ${summary ? `<p class="screen__description">Seed <code>${summary.seed}</code> &middot; ${summary.vehicle.name}</p>` : ''}
          <div class="cluster" role="list">${resources}</div>
          ${summary?.currentNode ? `<p>Last seen near <strong>${summary.currentNode.name}</strong> (${summary.currentNode.province}).</p>` : ''}
        </article>
        <div class="screen__actions">
          <button type="button" class="button button--primary" data-restart>Start Another Run</button>
          <button type="button" class="button button--secondary" data-title>Return to Title</button>
        </div>
      </div>
    `;

    container.appendChild(this.root);

    this.root.querySelector('[data-restart]').addEventListener('click', () => {
      this.manager.goToSetup();
    });

    this.root.querySelector('[data-title]').addEventListener('click', () => {
      this.manager.goToTitle();
    });

    focusFirstElement(this.root);
  }

  renderResourceChip(key, value) {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    return `<span class="chip" data-resource="${key}"><span aria-hidden="true">${value}</span> ${label}</span>`;
  }

  unmount() {
    if (this.root) {
      this.root.replaceChildren();
      this.root.remove();
      this.root = null;
    }
  }
}
