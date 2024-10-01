((LitElement) => {

  console.info('Light Entity Row 0.2.6');
  const html = LitElement.prototype.html;
  const css = LitElement.prototype.css;
  const nothing = LitElement.prototype.nothing;

  const SUPPORT_BRIGHTNESS = 1 << 0
  const SUPPORT_COLOR_TEMP = 1 << 1
  const SUPPORT_EFFECT = 1 << 2
  const SUPPORT_FLASH = 1 << 3
  const SUPPORT_RGB_COLOR = 1 << 4
  const SUPPORT_TRANSITION = 1 << 5
  const SUPPORT_XY_COLOR = 1 << 6
  const SUPPORT_WHITE_VALUE = 1 << 7

  class AdjustableLightEntityRow extends LitElement {
    static get properties() {
      return {
        _hass: Object,
        _config: Object,
        isOn: { type: Boolean },
        stateObj: { type: Object, value: null },
        members: { type: Array, value: null },
        brightnessMin: { type: Number, value: 1 },
        brightnessMax: { type: Number, value: 100 },
        tempMin: { type: Number, value: 175 },
        tempMax: { type: Number, value: 500 },
        step: { type: Number, value: 5 },
        brightness: Number,
        color_temp: Number,
        color_hue: Number,
        color_saturation: Number,
        tempButtons: {
          type: Array,
          value: []
        },
        support: {},
        showBrightness: { type: Boolean, value: false },
        showTempButtons: { type: Boolean, value: false },
        showColorTemp: { type: Boolean, value: false },
        showColorPicker: { type: Boolean, value: false },
        showColorSliders: { type: Boolean, value: false },
        currentColor: {type: Object, value: {h: 0, s: 0}}
      };
    }

    constructor() {
      super();
      this.stateObj = null
      this.members = null
      this.brightnessMin = 0
      this.brightnessMax = 100
      this.tempMin = 175
      this.tempMax = 500
      this.step = 5
      this.tempButtons = []
      this.support = {}
      this.showBrightness = false
      this.showTempButtons = false
      this.showColorTemp = false
      this.showColorPicker = false
      this.showColorSliders = false
      this.currentColorBrightness = null
    }
    static get styles() {
      return css`
 hui-generic-entity-row {
     margin: var(--ha-themed-slider-margin, initial);
 }
 .flex {
     display: flex;
     align-items: center;
 }
 .second-line {
     margin-left: 56px;
 }
 .second-line[hidden] {
     display: none;
 }
 .aux-icon {
     width: 20px;
 }
 .second-line paper-slider {
     width: 100%;
 }
 .flex-box {
     display: flex;
     justify-content: space-evenly;
 }
 ha-button {
     color: var(--primary-color);
     font-weight: 500;
     margin-right: -.57em;
     cursor: pointer;
 }
  ha-slider {
    width: 100%;
    min-width: 100px;
    --paper-slider-secondary-color: transparent;
  }
    `;
    }
    render() {
      let brightness;
      if (this.showBrightness) {
        brightness = html`<div class="second-line flex" ?hidden=${!this.isOn}>
            <ha-icon icon="mdi:brightness-6" class="aux-icon"></ha-icon>
            <ha-slider
              .min=${this.brightnessMin}
              .max=${this.brightnessMax}
              .step=${this.step}
              .value=${this.brightness}
              labeled
              pin
              @change=${this.selectedValueBrightness}
              @click=${this.stopPropagation}
              ignore-bar-touch
            ></ha-slider>
        </div>`
      }
      let colorTemp;
      if (this.showColorTemp) {
        colorTemp = html`<div class="second-line flex" ?hidden=${!this.isOn}>
          <ha-icon icon="mdi:thermometer-lines" class="aux-icon"></ha-icon>
          <ha-slider
            .min=${this.tempMin}
            .max=${this.tempMax}
            .value=${this.color_temp}
            .step=${this.step}
            labeled
            pin
            @change=${this.selectedValueColorTemp}
            @click=${this.stopPropagation}
            ignore-bar-touch
          ></ha-slider>
        </div>`
      }
      let colorTempButton;
      if (this.showTempButtons) {
        colorTempButton = html`<div class="flex-box">
              ${this.tempButtons.map(item =>
                html`<ha-button @click=${(evt) => this.handleButton(evt, item)}>${item.name}</ha-button>`
              )}
        </div>`
      }
      let colorSliders;
      if(this.showColorSliders){
        colorSliders = html`<div class="second-line flex" ?hidden=${!this.isOn}>
          <ha-icon icon="mdi:eyedropper-variant" class="aux-icon"></ha-icon>
          <ha-slider
            .min=0
            .max=359
            .value=${this.color_hue}
            .step=${this.step}
            pin
            @change=${this.selectedValueColorHue}
            @click=${this.stopPropagation}
            ignore-bar-touch
          ></ha-slider>
        </div>
        <div class="second-line flex" ?hidden=${!this.isOn}>
          <ha-icon icon="mdi:invert-colors" class="aux-icon"></ha-icon>
          <ha-slider
            .min=0
            .max=100
            .value=${this.color_saturation}
            .step=${this.step}
            pin
            @change=${this.selectedValueColorSaturation}
            @click=${this.stopPropagation}
            ignore-bar-touch
          ></ha-slider>
        </div>
        `
      }
      let colorPicker;
      if(this.showColorPicker){
        colorPicker=html`<div class="second-line flex">
          <ha-hs-color-picker
            .colorBrightness=${this.currentColorBrightness != null
              ? (this.currentColorBrightness * 255) / 100
              : undefined}
            .value=${this.currentColor}
            @value-changed=${this.colorSelected}
          ></ha-hs-color-picker>
        </div>`
      }
      let configButtons;
      if (this._buttons) {
        configButtons = html`<div class="flex-box">
              ${this._buttons.map(item =>
                html`<ha-button @click=${(ev) => this.handleButton(evt, item)}>${item.name}</ha-button>`
              )}
        </div>`
      }

      return html`<hui-generic-entity-row
          .config=${this._config}
          .hass=${this._hass} >
          <div class="flex">
            <ha-entity-toggle
              .stateObj=${this.stateObj}
              .hass=${this._hass}></ha-entity-toggle>
          </div>
        </hui-generic-entity-row>
        ${brightness}
        ${colorTemp}
        ${colorTempButton}
        ${colorSliders}
        ${colorPicker}
        ${configButtons}`
    }

    setConfig(config) {

      const checkServiceRegexp = /^(light|group)\./
      if (!checkServiceRegexp.test(config.entity)) {
        throw new Error(`invalid entity ${this.config.entity}`)
      }

      this._config = JSON.parse(JSON.stringify(config));
      if (config.buttons) { 
          this._buttons = JSON.parse(JSON.stringify(config.buttons))
      }
    }

    set hass(hass) {
      this._hass = hass;
      this.stateObj = this._config.entity in hass.states ? hass.states[this._config.entity] : null
      if (this.stateObj) {
        if (this.isGroup && this.stateObj.attributes.entity_id) {
          this.members = this.stateObj.attributes
            .entity_id.map(e => e in hass.states ? hass.states[e] : null)
        }
        const tempMid = this.tempMin + ((this.tempMax - this.tempMin) / 2)
        if (this.stateObj.state === 'on') {
          if (this.brightness === undefined && this.isGroup && this.members && this.members.length) {
            this.brightness = (this.members.reduce((b, e) => b + e.attributes.brightness, 0) / this.members.length) / 2.55
            this.color_temp = this.members.reduce((t, e) => t + e.attributes.color_temp, 0) / this.members.length
          } else if (!this.group) {
            this.brightness = this.stateObj.attributes.brightness / 2.55;
            this.color_temp = this.stateObj.attributes.color_temp;
          }
          if (this.stateObj.attributes.hs_color && Array.isArray(this.stateObj.attributes.hs_color)) {
            this.color_hue = this.stateObj.attributes.hs_color[0];
            this.color_saturation = this.stateObj.attributes.hs_color[1];
          } else {
            this.color_hue = 0
            this.color_saturation = 0
          }
          this.isOn = true;
        } else {
          this.brightness = this.brightnessMin;
          this.color_temp = tempMid;
          this.color_hue = 0;
          this.color_saturation = 0;
          this.isOn = false;
        }

        if (!this._config.hideBrightness && this.isSupported(SUPPORT_BRIGHTNESS)) {
          this.showBrightness = true
        }

        if (!this._config.hideTempButtons && this.isSupported(SUPPORT_COLOR_TEMP)) {
          this.showTempButtons = true
        }

        if (!this._config.hideColorTemp && this.isSupported(SUPPORT_COLOR_TEMP)) {
          this.showColorTemp = true
          if (this.stateObj.attributes.min_mireds) {
            this.tempMin = this.stateObj.attributes.min_mireds
          }
          if (this.stateObj.attributes.max_mireds) {
            this.tempMax = this.stateObj.attributes.max_mireds
          }
          this.tempButtons = [{
            name: "Cool",
            service_data: {
              color_temp: this.tempMin
            }
          }, {
            name: "Normal",
            service_data: {
              color_temp: tempMid
            }
          }, {
            name: "Warm",
            service_data: {
              color_temp: this.tempMax
            }
          }]
        }

        if (this._config.showColorPicker && this.isSupported(SUPPORT_RGB_COLOR)) {
          this.showColorPicker = true
          if (this.stateObj.attributes && this.stateObj.attributes.hs_color && Array.isArray(this.stateObj.attributes.hs_color)) {
            this.currentColor = {
              h: this.stateObj.attributes.hs_color[0],
              s: this.stateObj.attributes.hs_color[1]
            }
          } else {
            this.currentColor = {
              h: 0,
              s: 0
            }
          }
          const currentRgbColor = this.stateObj.attributes.color_mode === "rgbww"
          ? this.stateObj.attributes.rgbww_color
          : this.stateObj.attributes.color_mode === "rgbww"
              ? this.stateObj.attributes.rgbw_color
              : this.stateObj.attributes.rgb_color;
          this.currentColorBrightness = currentRgbColor
            ? Math.round((Math.max(...currentRgbColor.slice(0, 3)) * 100) / 255)
            : undefined;
        }else {
          this.currentColorBrightness = null
        }
        if (this._config.showColorSliders && this.isSupported(SUPPORT_RGB_COLOR)) {
          this.showColorSliders = true
        }
      }

    }

    selectedValueBrightness(ev) {
      const value = Math.ceil(parseInt(ev.target.value, 10) * 2.55);
      const param = { entity_id: this.stateObj.entity_id };
      if (Number.isNaN(value)) return;
      if (value === 0) {
        this._hass.callService('light', 'turn_off', param);
      } else {
        param.brightness = value;
        this._hass.callService('light', 'turn_on', param);
      }
    }

    selectedValueColorTemp(ev) {
      const value = parseInt(ev.target.value, 10);
      const param = { entity_id: this.stateObj.entity_id };
      if (Number.isNaN(value)) return;
      param.color_temp = value;
      this._hass.callService('light', 'turn_on', param);
    }

    selectedValueColorHue(ev) {
      const value = parseFloat(ev.target.value);
      const param = { entity_id: this.stateObj.entity_id };
      if (Number.isNaN(value)) return;
      param.hs_color = [value, this.color_saturation];
      this._hass.callService('light', 'turn_on', param);
    }

    selectedValueColorSaturation(ev) {
      const value = parseFloat(ev.target.value);
      const param = { entity_id: this.stateObj.entity_id };
      if (Number.isNaN(value)) return;
      param.hs_color = [this.color_hue, value];
      this._hass.callService('light', 'turn_on', param);
    }

    colorSelected(ev) {
      this.stopPropagation(ev)
      const param = { entity_id: this.stateObj.entity_id };
      param.hs_color = ev.detail.value
      this._hass.callService('light', 'turn_on', param);
    }

    handleButton(ev, item){
      this.stopPropagation(ev)
      item.service_data.entity_id = this.stateObj.entity_id
      this._hass.callService('light', 'turn_on', item.service_data)
    }

    stopPropagation(ev) {
      ev.stopPropagation();
    }

    get isGroup() {
      return this._config.entity.indexOf(/^group/)
    }

    isSupported(feature) {
      if (this.isGroup) return true
      const res = this.stateObj.attributes.supported_features & feature
      return res != 0
    }
  }

  customElements.define('light-entity-row', AdjustableLightEntityRow);
})(window.LitElement || Object.getPrototypeOf(customElements.get("hui-masonry-view")));

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'light-entity-row',
  name: 'Light entity row',
});
