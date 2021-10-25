import {
  setupTokenlistV2,
  wrapListener,
  getTokenV2,
  parseInput,
} from './utils.js';
import {
  encodeMetadata,
  sendTransaction
} from './rollup.js';
import { ipfsPush } from './ipfs.js';
import { COMMON_STYLESHEET } from './component.js';

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
<style>
button, .button, button *, .button * {
  background-color: var(--color-bg-button);
  color: var(--color-button);
  border-color: var(--color-border-button);
}
:host {
  width: 90%;
  margin-right: 5%;
  margin-left: 5%;
}
.communityBox {
  border-radius: 2em;
  background-color: var(--color-accent-grey);
  width:100%;
}
.communityBox canvas {
  width: 100%;
  min-width:20ch;
  border: 1px solid var(--color-bg-invert);
  border-radius: 2em;
  cursor:pointer;

}
.communityBox input, textarea {
  margin-bottom: 1em;
  color: var(--color-text);
  border-radius: 2em;
  border: 1px solid var(--color-accent-grey);
  background-color: var(--color-bg);
  min-width:14ch;
  width:100%;
}
input::placeholder, textarea::placeholder {
  color: var(--color-grey);
}
</style>
<div class='communityBox' style='padding:2em;'>
  <div class='left' style='margin-bottom: 2em;'>
    <h3><span><emoji-seedling></emoji-seedling><span> Create a Community</span></span></h3>
  </div>



  <div class='flex row between' style='align-items:flex-start;flex-wrap:wrap;gap:2em;'>
    <div id='input' class='flex col center evenly' style='width:auto;flex-grow:1;'>
      <input style='width:100%;height:1em;justify-content:center;' id='title' placeholder='Name of Community'>
      <textarea style='width:100%;resize:vertical;min-height:8ch;' id='details' placeholder='Info About Community'></textarea>

      <div class='flex row between' style='width:100%;flex-wrap:nowrap;'>
        <input style='height:1em;' id='token' placeholder='Governance Token' list='tokenlistv2'>
        <a class='right bold s' style='white-space:nowrap;padding:.5em;text-decoration:underline;'>Create a token</a>
      </div>
    </div>
    <div class='flex col center' style='flex-grow:1;width:50%;min-width:25ch;'>
        <div style=''>
          <input style='display:none;' id='file' type='file' accept='image/*'>
          <canvas></canvas>
          <label class='s'>
            Aspect ratio is 2:1. i.e 1200x600
          </label>
        </div>
    </div>
  </div>



  <div class='flex col align-right'>
    <button id='create' style='place-self:flex-end;'>Create</button>
  </div>
</div>
<div class='flex col'>
  <button id='boxleg'>&#10006; CLOSE</button>
</div>
`;

//issue: images being uploaded with added whitespace to fill height/width requirements?
export default class HabitatCommunityPreviewCreator extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(COMMON_STYLESHEET.cloneNode(true), TEMPLATE.content.cloneNode(true));

    this._ctx = this.shadowRoot.querySelector('canvas').getContext('2d');
    this._fileInput = this.shadowRoot.querySelector('#file');
    this.shadowRoot.querySelector('#file').addEventListener('change', this._loadFile.bind(this), false);
    this._ctx.canvas.addEventListener('click', () => this._fileInput.click(), false);
    const w = 1200;
    const h = 600;
    this._ctx.canvas.width = w;
    this._ctx.canvas.height = h;

    wrapListener(this.shadowRoot.querySelector('#create'), this.create.bind(this));
    wrapListener(this.shadowRoot.querySelector('#boxleg'), () => this.remove());

    this._ctx.font = '128px Everett';
    this._ctx.fillStyle = 'rgba(255,255,255,.5)';
    this._ctx.fillRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.width);
    this._ctx.fillStyle = 'rgba(0,0,0,.5)';
    this._ctx.fillText('+', (w / 2) - 54, (h / 2) + 54);
    setupTokenlistV2(this.shadowRoot);
  }

  _loadFile (evt) {
    const file = evt.target.files[0];
    const obj = URL.createObjectURL(file);
    const img = document.createElement('img');

    img.onload = () => {
      this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
      this._ctx.drawImage(img, 0, 0);
    };
    img.src = obj;
  }

  async bannerToBlob () {
    const originalFile = this._fileInput.files[0];
    if (!originalFile) {
      return;
    }

    const canvasBlob = await new Promise(
      (resolve) => {
        this._ctx.canvas.toBlob(resolve, 'image/webp')
    });

    return canvasBlob.size > originalFile.size ? originalFile : canvasBlob;
  }

  async create () {
    const obj = parseInput(this.shadowRoot.querySelector('#input'));
    if (obj.error) {
      return;
    }
    const token = await getTokenV2(obj.config.token);
    const meta = {
      title: obj.config.title,
      details: obj.config.details,
    };

    const bannerBlob = await this.bannerToBlob();
    if (bannerBlob) {
      const type = bannerBlob.type.replace('image/', '.');
      const fileName = 'banner' + type;
      const ret = await ipfsPush({ [fileName]: new Uint8Array(await bannerBlob.arrayBuffer()) });
      meta.bannerCid = ret[0].Hash;
    }
    const args = {
      governanceToken: token.address,
      metadata: encodeMetadata(meta)
    };
    await sendTransaction('CreateCommunity', args);
    this.remove();
  }
}
customElements.define('habitat-community-preview-creator', HabitatCommunityPreviewCreator);
