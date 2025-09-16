import { trapFocus, releaseFocus, focusFirstElement, announce } from '../systems/a11y.js';

export class EventModal {
  constructor(event, options = {}) {
    this.event = event;
    this.options = options;
    this.backdrop = null;
    this.modal = null;
    this.releaseTrap = null;
    this.isOpen = false;
    this.choicesNode = null;
    this.outcomeNode = null;
  }

  open() {
    if (typeof document === 'undefined' || this.isOpen) {
      return;
    }

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    this.backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="event-title" aria-describedby="event-description">
        <div class="stack">
          <header>
            <h2 id="event-title" class="modal__title">${this.event.title}</h2>
            <p id="event-description" class="screen__description">${this.event.description}</p>
          </header>
          <div class="modal__choices" data-choices>
            ${this.event.choices.map((choice) => this.renderChoice(choice)).join('')}
          </div>
          <div class="notice" data-outcome hidden role="status"></div>
          <div class="stack">
            <button type="button" class="button button--secondary modal__close" data-close>Return to map</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    this.modal = this.backdrop.querySelector('.modal');
    this.choicesNode = this.backdrop.querySelector('[data-choices]');
    this.outcomeNode = this.backdrop.querySelector('[data-outcome]');

    this.choicesNode.addEventListener('click', (event) => {
      const button = event.target.closest('[data-choice]');
      if (!button) {
        return;
      }
      if (button.disabled) {
        return;
      }
      this.handleChoice(button.dataset.choice);
    });

    this.backdrop.querySelector('[data-close]').addEventListener('click', () => {
      this.close();
    });

    this.backdrop.addEventListener('pointerdown', (event) => {
      if (event.target === this.backdrop) {
        event.preventDefault();
        event.stopPropagation();
      }
    });

    this.releaseTrap = trapFocus(this.modal);
    focusFirstElement(this.modal);
    announce(`${this.event.title}. ${this.event.description}`);
    this.isOpen = true;
  }

  renderChoice(choice) {
    const canChoose = this.options.state?.eventEngine.canChoose(this.event, choice.id);
    const disabled = canChoose === false;
    const description = choice.description ? `<span class="screen__description">${choice.description}</span>` : '';
    return `
      <button type="button" class="button button--surface" data-choice="${choice.id}" ${disabled ? 'disabled' : ''}>
        <span class="stack" style="align-items:flex-start; text-align:left;">
          <strong>${choice.label}</strong>
          ${description}
        </span>
      </button>
    `;
  }

  handleChoice(choiceId) {
    if (!this.options.state) {
      return;
    }

    const result = this.options.state.resolvePendingEvent(choiceId);
    if (!result) {
      return;
    }

    if (result.blocked) {
      this.showOutcome('That option is currently unavailable.');
      return;
    }

    this.showOutcome(result.choice.outcome || 'You press on.');

    if (typeof this.options.onResolve === 'function') {
      this.options.onResolve(result);
    }
  }

  showOutcome(message) {
    if (!this.outcomeNode) {
      return;
    }
    this.outcomeNode.hidden = false;
    this.outcomeNode.textContent = message;
    announce(message);
    const buttons = Array.from(this.choicesNode.querySelectorAll('button'));
    buttons.forEach((button) => {
      button.disabled = true;
    });
  }

  close() {
    if (!this.isOpen) {
      return;
    }

    if (this.releaseTrap) {
      this.releaseTrap();
      this.releaseTrap = null;
    } else {
      releaseFocus();
    }

    this.backdrop?.remove();
    this.backdrop = null;
    this.modal = null;
    this.isOpen = false;
  }
}
