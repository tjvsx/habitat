const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
<style>
:host {
  margin: 1rem;
  width: 12ch;
  position: relative;
}

* {
  transform: translateY(-50%);
}

.min, .max, .q1, .q2, .q3 {
  position: absolute;
  z-index: 1;
  margin: 0;
  top: 50%;
  bottom: 50%;
}

.min {
  height: .75em;
  width: .75em;
  border-radius: 50%;
  left: -4%;
  background-color: #579E86;
  ;
}

.max {
  height: .75em;
  width: .75em;
  border-radius: 50%;
  right: -4%;
  background-color: #F87972;
  ;
}

.q1 {
  border-left: 1px solid;
  height: .4em;
  left: 25%;
}

.q2 {
  border-left: 1px solid;
  height: .4em;
  left: 50%;
}

.q3 {
  border-left: 1px solid;
  height: .4em;
  left: 75%;
}

.bar {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  height: .1em;
  z-index: 1;

  background: transparent;
  background: linear-gradient(90deg, #579D83 0 4%, #6FAA82 4% 16%, #89B981 16% 23%, #99C281 23% 30%, #ADCE80 30% 40%, #CCE080 40% 45%, #D5E37E 45% 53%, #D6D87D 53% 61%, #E1C87B 61% 80%, #E8AF78 67% 80%, #F28F74 80% 93%, #F87972 93% 100%);
  transition: all .07s linear;
}

#inner {
  appearance: none; 
  display: block;
  width: 100%; 
  background: transparent;
  position: absolute;
  z-index: 2;
  user-select: none;
  margin-right: auto;
  margin-left: auto;
  margin-top: auto;
  margin-bottom: auto;
  cursor: pointer;
}

#inner::-webkit-slider-thumb {
  appearance: none;
  height: 1.4rem;
  width: 0.55rem;
  background: #F2F2F2;
  border: 1px solid var(--color-bg-invert);
  border-radius: 2em;
  z-index: 3;
}

</style>
<input type='range' id='inner' value='0' />
<div class='bar'>
  <span class='min'></span>
  <span class='q1'></span>
  <span class='q2'></span>
  <span class='q3'></span>
  <span class='max'></span>
</div>
`;

const ATTR_VALUE = 'value';

class HabitatSentimentSlider extends HTMLElement {
  static get observedAttributes () {
    return [ATTR_VALUE];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(TEMPLATE.content.cloneNode(true));

    this.inner = this.shadowRoot.querySelector('#inner');
    this.focused = false;
    this.scheduled = false; //?
    this.value = 0;
    this._width = 0;
    this._x = 0;

    this.inner.addEventListener('mousedown', this, false);
    this.inner.addEventListener('mouseup', this, false);
    this.inner.addEventListener('mousemove', this, false);
    this.inner.addEventListener('mouseleave', this, false);
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (name === ATTR_VALUE) {
      this.value = Number(newValue);
      this.defaultValue = this.value;
    }

    this._width = 0;
    this.scheduleUpdate(true);
  }

  handleEvent (evt) {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    this[evt.type](evt);
  }

  mouseleave (evt) {
    if (!this.focused) {
      return;
    }
    this.focused = false;
    this._x = evt.offsetX;
    this.update();
    this.dispatchEvent(new Event('release'));
  }

  mousedown (evt) {
    this.focused = true;
    this._width = this.offsetWidth;
    this._x = evt.offsetX;
    this.scheduleUpdate();
  }

  mouseup (evt) {
    this.focused = false;
    this.scheduleUpdate();
    this.dispatchEvent(new Event('release'));
  }

  mousemove (evt) {
    if (!this.focused) {
      return;
    }
    this._x = evt.offsetX;
    this.scheduleUpdate();
  }

  scheduleUpdate (doNotCalculate = false) {
    if (this._width === 0) {
      this._width = this.offsetWidth;
    }

    if (doNotCalculate) {
      this.value = Math.min(1, Math.max(0, this.value));
    } else {
      const f = this._width / 32;
      if (this._x <= f) {
        this._x = 0;
      } else if (this._x >= this._width - f) {
        this._x = this._width;
      }
      this.value = Math.min(1, Math.max(0, (this._x / this._width)));
    }

    if (this.scheduled) {
      return;
    }
    this.scheduled = true;
    window.requestAnimationFrame(() => this.update());
  }

  update () {
    this.scheduled = false;
    this.inner.style['padding-left'] = `${Math.min(100, this.value * 100)}%`;

    if (this.value !== this.defaultValue) {
      this.dispatchEvent(new Event('change'));
    }
  }
}
customElements.define('habitat-sentiment-slider', HabitatSentimentSlider);



