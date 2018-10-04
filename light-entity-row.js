const SUPPORT_BRIGHTNESS = 1<<0
const SUPPORT_COLOR_TEMP = 1<<1
const SUPPORT_EFFECT = 1<<2
const SUPPORT_FLASH = 1<<3
const SUPPORT_RGB_COLOR = 1<<4
const SUPPORT_TRANSITION = 1<<5
const SUPPORT_XY_COLOR = 1<<6
const SUPPORT_WHITE_VALUE = 1<<7

class AdjustableLightEntityRow extends Polymer.Element {
  static get template() {
    return Polymer.html`
<style>
 hui-generic-entity-row {
     margin: var(--ha-themed-slider-margin, initial);
 }
 .flex {
     display: flex;
     align-items: center;
 }
 .second-line paper-slider {
     width: 100%;
 }
 .flex-box {
     display: flex;
     justify-content: space-evenly;
 }
 paper-button {
     color: var(--primary-color);
     font-weight: 500;
     margin-right: -.57em;
 }
</style>
<hui-generic-entity-row
  config="[[_config]]"
  hass="[[_hass]]" >
    <div class="flex">
        <ha-entity-toggle
          state-obj="[[stateObj]]"
          hass="[[_hass]]"></ha-entity-toggle>
    </div>
</hui-generic-entity-row>

<template is="dom-if" if="[[showBrightness]]">
    <div class="second-line flex">
        <span>Brightness</span>
        <paper-slider
          min="[[brightnessMin]]"
          max="[[brightnessMax]]"
          value="{{brightness}}"
          step="[[step]]"
          pin
          on-change="selectedValueBrightness"
          ignore-bar-touch
          on-click="stopPropagation">
        </paper-slider>
    </div>
</template>
<template is="dom-if" if="[[showColorTemp]]">
    <div class="second-line flex">
        <span>Temperature</span>
        <paper-slider
          min="[[tempMin]]"
          max="[[tempMax]]"
          value="{{color_temp}}"
          step="[[step]]"
          pin
          on-change="selectedValueColorTemp"
          ignore-bar-touch
          on-click="stopPropagation">
        </paper-slider>
    </div>
    <div class="flex-box">
        <template is="dom-repeat" items="[[tempButtons]]">
            <paper-button on-click="handleButton">{{item.name}}</paper-button>
        </template>
    </div>
</template>    

<template is="dom-if" if="[[showColorPicker]]">
    <div class="flex-box">
        <ha-color-picker on-colorselected="colorSelected"
                         width="200" height="200" radius="95"
                         hs-color="[[currentColor]]"
                         desired-hs-color="[[currentColor]]"
                         on-click="stopPropagation"></ha-color-picker>
    </div>
</template>

<div class="flex-box">
    <template is="dom-repeat" items="[[_config.buttons]]">
        <paper-button on-click="handleButton">{{item.name}}</paper-button>
    </template>
</div>
    `
  }

  static get properties() {
    return {
      _hass: Object,
      _config: Object,
      isOn: { type: Boolean },
      stateObj: { type: Object, value: null },
      brightnessMin: { type: Number, value: 0 },
      brightnessMax: { type: Number, value: 100 },
      tempMin: { type: Number, value: 175 },
      tempMax: { type: Number, value: 500 },
      step: { type: Number, value: 5 },
      brightness: Number,
      color_temp: Number,
      tempButtons: {
        type: Array,
        value: []
      },
      support: {},
      showBrightness: {type: Boolean, value: false},
      showColorTemp: {type: Boolean, value: false},
      showColorPicker: {type: Boolean, value: false},
      currentColor: {type: Object, value: {h: 0, s: 0}}
    };
  }

  colorSelected(ev) {
    this.stopPropagation(ev)
    const param = {entity_id: this.stateObj.entity_id };
    param.hs_color = [ev.detail.hs.h, ev.detail.hs.s*100]
    this._hass.callService('light', 'turn_on', param);
  }

  setConfig(config)
  {

    const checkServiceRegexp = /^light\./
    if (!checkServiceRegexp.test(config.entity)) {
      throw new Error(`invalid entity ${config.entity}`)
    }
    
    this._config = config;
    this._config.buttons = config.buttons || []

    
  }

  set hass(hass) {
    this._hass = hass;
    this.stateObj = this._config.entity in hass.states ? hass.states[this._config.entity] : null;
    if(this.stateObj) {
      const tempMid = this.tempMin + ((this.tempMax - this.tempMin) / 2)
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
      if(this.stateObj.state === 'on') {
        this.brightness = this.stateObj.attributes.brightness/2.55;
        this.color_temp = this.stateObj.attributes.color_temp;
        this.isOn = true;
      } else {
        this.brightness = this.brightnessMin;
        this.color_temp = tempMid;
        this.isOn = false;
      }
      
      if (!this._config.hideBrightness && this.isSupported(SUPPORT_BRIGHTNESS)) {
        this.showBrightness = true
      }
      
      if (!this._config.hideColorTemp && this.isSupported(SUPPORT_COLOR_TEMP)) {
        this.showColorTemp = true
        if (this.stateObj.attributes.min_mireds) {
          this.tempMin = this.stateObj.attributes.min_mireds
        }
        if (this.stateObj.attributes.max_mireds) {
          this.tempMax = this.stateObj.attributes.max_mireds
        }
      }
      
      if (this._config.showColorPicker && this.isSupported(SUPPORT_RGB_COLOR)) {
        this.showColorPicker = true
        this.currentColor = {
          h: this.stateObj.attributes.hs_color[0],
          s: this.stateObj.attributes.hs_color[1]
        }
      }
    }

  }

  selectedValueBrightness(ev) {
    const value = Math.ceil(parseInt(this.brightness, 10)*2.55);
    const param = {entity_id: this.stateObj.entity_id };
    if(Number.isNaN(value)) return;
    if(value === 0) {
      this._hass.callService('light', 'turn_off', param);
    } else {
      param.brightness = value;
      this._hass.callService('light', 'turn_on', param);
    }
  }

  selectedValueColorTemp(ev) {
    const value = parseInt(this.color_temp, 10)
    const param = {entity_id: this.stateObj.entity_id };
    if(Number.isNaN(value)) return;
    param.color_temp = value;
    this._hass.callService('light', 'turn_on', param);
  }

  stopPropagation(ev) {
    ev.stopPropagation();
  }

  isSupported(feature) {
    const res = this.stateObj.attributes.supported_features & feature
    return res != 0
  }
  
  handleButton(evt) {
    this.stopPropagation(evt)
    const button = evt.model.get('item')
    button.service_data.entity_id = this.stateObj.entity_id
    this._hass.callService('light', 'turn_on', button.service_data)
  }
}

customElements.define('light-entity-row', AdjustableLightEntityRow);
