import { GameState } from './systems/state.js';
import { TitleScreen } from './ui/TitleScreen.js';
import { SetupScreen } from './ui/SetupScreen.js';
import { MapScreen } from './ui/MapScreen.js';
import { EndScreen } from './ui/EndScreen.js';

class ScreenManager {
  constructor(root, state) {
    this.root = root;
    this.state = state;
    this.activeScreen = null;
  }

  get currentScreen() {
    return this.activeScreen;
  }

  async show(screen) {
    if (!screen) {
      throw new Error('Cannot show an undefined screen.');
    }

    if (this.activeScreen?.unmount) {
      this.activeScreen.unmount();
    }

    this.root.replaceChildren();
    this.activeScreen = screen;

    if (typeof screen.mount === 'function') {
      await screen.mount(this.root, this, this.state);
    }

    this.root.dispatchEvent(
      new CustomEvent('screenchange', {
        detail: { screen: screen.constructor.name },
      })
    );
  }

  async goToTitle() {
    await this.show(new TitleScreen());
  }

  async goToSetup() {
    await this.show(new SetupScreen());
  }

  async goToMap() {
    await this.show(new MapScreen());
  }

  async goToEnd(result) {
    await this.show(new EndScreen(result));
  }
}

async function init() {
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('App root not found');
  }

  const state = new GameState();
  await state.bootstrap();

  const manager = new ScreenManager(app, state);
  await manager.goToTitle();

  window.canadianTrail = {
    manager,
    state,
  };
}

init().catch((error) => {
  console.error('Canadian Trail failed to initialise', error);
});

export { ScreenManager, GameState, TitleScreen, SetupScreen, MapScreen, EndScreen };
