import { Assets } from '../systems/assets.js';
import { focusFirstElement } from '../systems/a11y.js';

export class TitleScreen {
  constructor() {
    this.root = null;
    this.manager = null;
    this.state = null;
  }

  async mount(container, manager, state) {
    this.manager = manager;
    this.state = state;

    this.root = document.createElement('section');
    this.root.className = 'screen screen--title';
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-labelledby', 'title-heading');

    const summary = state.getSummary();
    const hasSave = Boolean(summary && summary.status === 'in-progress');

    const hero = await Assets.get('ui-logo');

    this.root.innerHTML = `
      <header class="screen__header">
        <div>
          <p class="chip">Static build &middot; Deterministic runs</p>
          <h1 id="title-heading">Canadian Trail: Out There, Eh?</h1>
          <p class="screen__description">
            Cruise the Trans-Canada with a ragtag crew. Every fuel stop and snack stash counts&mdash;and every run is reproducible.
          </p>
        </div>
        <figure class="card" data-title-hero>
          <img src="${hero.src}" alt="Stylised maple leaf road trip emblem" width="${hero.width}" height="${hero.height}" />
        </figure>
      </header>
      <div class="stack">
        <div class="screen__actions" role="group" aria-label="Main menu">
          <button type="button" class="button button--primary" data-new-run>New Road Trip</button>
          <button type="button" class="button button--surface" data-continue ${hasSave ? '' : 'disabled'}>
            Continue Journey
          </button>
        </div>
        ${hasSave ? this.renderSaveSummary(summary) : this.renderNoSave()}
      </div>
    `;

    container.appendChild(this.root);

    this.root.querySelector('[data-new-run]').addEventListener('click', () => {
      this.manager.goToSetup();
    });

    this.root.querySelector('[data-continue]').addEventListener('click', () => {
      if (this.state.hasActiveRun()) {
        this.manager.goToMap();
      }
    });

    focusFirstElement(this.root);
  }

  renderNoSave() {
    return `
      <div class="card notice" role="status">
        <strong>First time on the Trail?</strong>
        <p>Start a fresh run to generate a reproducible seed and tour Canada node by node.</p>
      </div>
    `;
  }

  renderSaveSummary(summary) {
    const log = summary.storyLog
      .map((entry) => `<li>${entry}</li>`)
      .join('');

    return `
      <article class="card" aria-label="Current expedition summary">
        <h2>Last Known Status</h2>
        <p class="screen__description">Seed <code>${summary.seed}</code> &middot; ${summary.vehicle.name}</p>
        <div class="cluster" role="list">
          ${this.renderResourceChip('Gas', summary.resources.gas)}
          ${this.renderResourceChip('Snacks', summary.resources.snacks)}
          ${this.renderResourceChip('Ride', summary.resources.ride)}
          ${this.renderResourceChip('Money', summary.resources.money)}
        </div>
        <p>
          Parked near <strong>${summary.currentNode?.name ?? 'an unknown locale'}</strong>
          (${summary.currentNode?.province ?? 'Canada'}).
        </p>
        <h3>Recent Logs</h3>
        <ul class="map__log">${log}</ul>
      </article>
    `;
  }

  renderResourceChip(label, value) {
    return `<span class="chip" data-resource="${label.toLowerCase()}"><span aria-hidden="true">${value}</span> ${label}</span>`;
  }

  unmount() {
    if (this.root) {
      this.root.replaceChildren();
      this.root.remove();
      this.root = null;
    }
  }
}
