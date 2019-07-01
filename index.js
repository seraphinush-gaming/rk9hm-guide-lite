/* const START = 1202128153;
const SECOND_IN = 1202128160;
const SECOND_OUT = 1202128161;
const SECOND_WAVE = 1202128162;
 */

class Rk9HmGuideLite {

  constructor(mod) {

    this.mod = mod;
    this.cmd = mod.command;
    this.settings = mod.settings;
    this.hooks = [];

    this.enable = this.settings.enable;

    this.chatChannel = 0;
    this.curZone = 0;
    this.loaded = false;
    this.mechStrings = this.mod.region === 'kr' ? ['근', '원', '터', 'ㅇ'] : ['out', 'in', 'wave', 'o'];
    this.messageA = this.mechStrings[3];
    this.messageB = this.mechStrings[3];
    this.myZone = 0;
    this.prevMechFirst = true;
    this.thirdBoss = false;

    // command
    this.cmd.add('rk', {
      '$none': () => {
        this.enable = !this.enable;
        if (this.enable && this.myZone === 9935) {
          this.load();
          this.loaded = true;
        }
        else {
          this.unload();
          this.loaded = false;
        }
        this.send(`${this.enable ? 'En' : 'Dis'}abled`);
      },
      'party': () => {
        // 1
        if (this.chatChannel !== 0 || this.chatChannel !== 1) {
          this.chatChannel = 1;
        } else {
          this.chatChannel = 0;
        }
        this.send(`Sending mechanics order to party chat ${this.chatChannel === 0 ? 'en' : 'dis'}abled`);
      },
      'notice': () => {
        // 21
        if (this.chatChannel !== 0 || this.chatChannel !== 21) {
          this.chatChannel = 21;
        } else {
          this.chatChannel = 0;
        }
        this.send(`Sending mechanics order to notice chat ${this.chatChannel === 0 ? 'en' : 'dis'}abled`);
      },
      '$default': () => this.send(`Invalid argument. usage : rk []`)
    });

    // game state
    this.mod.hook('S_LOAD_TOPO', 3, { order: -1000 }, (e) => {
      this.myZone = e.zone;
      if (this.enable && !this.loaded && e.zone === 9935) {
        this.load();
        this.loaded = true;
      }
      else if (this.enable && this.loaded && e.zone !== 9935) {
        this.unload();
        this.loaded = false;
        this.messageA = this.mechStrings[3];
        this.messageB = this.mechStrings[3];
        this.prevMechFirst = true;
        this.send(`Leaving RK-9 Kennel (hard). unloaded guide module.`);
      }
    });

  }

  // helper
  toChat(msg) {
    if (this.chatChannel) {
      this.mod.send('C_CHAT', 1, {
        channel: this.chatChannel,
        message: msg
      });
    }
    else {
      this.send(msg);
    }
  }

  mechOrder(delay) {
    this.mod.setTimeout(() => {
      if (this.prevMechFirst)
        this.toChat(`${this.messageA} ${this.messageB}`);
      else
        this.toChat(`${this.messageB} ${this.messageA}`);
    }, delay);
  }

  // code
  hook() {
    this.hooks.push(this.mod.hook(...arguments));
  }

  load() {
    this.hook('S_BOSS_GAGE_INFO', 3, (e) => {
      this.thirdBoss = e.templateId === 3000;
    });

    this.hook('S_DUNGEON_EVENT_MESSAGE', 2, (e) => {
      if (this.thirdBoss) {
        let id = parseInt(e.message.replace('@dungeon:', ''));
        switch (id) {
          case 9935302:
            this.messageA = this.mechStrings[0];
            this.mechOrder(2000);
            break;
          case 9935303:
            this.messageA = this.mechStrings[1];
            this.mechOrder(2000);
            break;
          case 9935304:
            this.messageA = this.mechStrings[2];
            this.mechOrder(2000);
            break;
          case 9935311:
            this.prevMechFirst = true;
            this.mechOrder(2000);
            break;
          case 9935312:
            this.prevMechFirst = false;
            this.mechOrder(2000);
            break;
        }
      }
    });

    this.hook('S_QUEST_BALLOON', 1, (e) => {
      if (this.thirdBoss) { // relevant IDs range from 935301 to 935303
        let index = parseInt(e.message.replace('@monsterBehavior:', '')) - 935301;
        if (0 <= index && index < 3) {
          this.messageB = this.mechStrings[index];
          this.mod.setTimeout(() => {
            this.messageA = this.messageB;
            this.messageB = this.mechStrings[3];
            this.mechOrder(6000);
          }, 8000);
        }
      }
    });

    this.send(`Entering RK-9 Kennel (hard). loaded guide module.`);
  }

  unload() {
    if (this.hooks.length) {
      for (let h of this.hooks) {
        this.mod.unhook(h);
      }
      this.hooks = [];
    }
  }

  send(msg) { this.cmd.message(': ' + msg); }

  // reload
  saveState() {
    return this.myZone;
  }

  loadState(state) {
    if (this.enable && !this.loaded && state === 9935) {
      this.load();
      this.loaded = true;
      this.curZone = state;
    }
  }

  destructor() {
    this.unload();

    this.cmd.remove('rk');

    this.thirdBoss = undefined;
    this.prevMechFirst = undefined;
    this.myZone = undefined;
    this.messageB = undefined;
    this.messageA = undefined;
    this.mechStrings = undefined;
    this.loaded = undefined;
    this.curZone = undefined;
    this.chatChannel = undefined;

    this.enable = undefined;
    this.hooks = undefined;
    this.cmd = undefined;
    this.mod = undefined;
  }

}

module.exports = function Rk9HmGuideLiteLoader(mod) {
  return new Rk9HmGuideLite(mod);
}