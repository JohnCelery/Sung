import { focusFirstElement } from '../systems/a11y.js';

export class SetupScreen {
  constructor() {
    this.root = null;
    this.manager = null;
    this.state = null;
  }

  async mount(container, manager, state) {
    this.manager = manager;
    this.state = state;

    const vehicles = state.getVehicles();
    const suggestedSeed = state.constructor.generateSeed();

    this.root = document.createElement('section');
    this.root.className = 'screen screen--setup';
    this.root.setAttribute('role', 'form');
    this.root.setAttribute('aria-labelledby', 'setup-heading');

    const vehicleCards = vehicles
      .map(
        (vehicle, index) => `
          <label class="card" data-vehicle-option>
            <input type="radio" name="vehicle" value="${vehicle.id}" ${index === 0 ? 'checked' : ''} />
            <div class="stack">
              <div>
                <h3>${vehicle.name}</h3>
                <p class="screen__description">${vehicle.description}</p>
              </div>
              <div class="cluster" role="list">
                ${this.renderResourceChip('Gas', vehicle.resources.gas)}
                ${this.renderResourceChip('Snacks', vehicle.resources.snacks)}
                ${this.renderResourceChip('Ride', vehicle.resources.ride)}
                ${this.renderResourceChip('Money', vehicle.resources.money)}
              </div>
            </div>
          </label>
        `
      )
      .join('');

    this.root.innerHTML = `
      <header class="screen__header">
        <div>
          <h1 id="setup-heading">Spin up a new seeded road trip</h1>
          <p class="screen__description">
            Choose your ride, set a memorable seed, and hit the Canadian Trail. Every choice is deterministic&mdash;share the seed to challenge friends.
          </p>
        </div>
      </header>
      <form class="stack" data-setup-form>
        <fieldset class="stack">
          <legend>Select your starting vehicle</legend>
          <div class="stack" role="radiogroup" aria-label="Vehicle presets">
            ${vehicleCards}
          </div>
        </fieldset>
        <label class="stack">
          <span>Road trip seed</span>
          <input type="text" name="seed" inputmode="numeric" autocomplete="off" value="${suggestedSeed}" aria-describedby="seed-help" />
          <small id="seed-help" class="screen__description">Enter digits or a memorable phrase. We hash it into a deterministic seed.</small>
        </label>
        <div class="screen__actions">
          <button type="submit" class="button button--primary">Launch Run</button>
          <button type="button" class="button button--secondary" data-back>Back to Title</button>
        </div>
      </form>
    `;

    container.appendChild(this.root);

    this.root.querySelector('[data-back]').addEventListener('click', () => {
      this.manager.goToTitle();
    });

    this.root.querySelector('[data-setup-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const vehicleId = formData.get('vehicle');
      const seedInput = (formData.get('seed') ?? '').toString().trim();
      const seed = seedInput
        ? Number.isNaN(Number(seedInput))
          ? this.state.constructor.deriveSeedFromString(seedInput)
          : Number(seedInput)
        : this.state.constructor.generateSeed();

      this.state.startNewRun({ vehicleId, seed });
      this.manager.goToMap();
    });

    focusFirstElement(this.root);
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
