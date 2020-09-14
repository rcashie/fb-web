import { PolymerElement } from '@polymer/polymer/polymer-element.js';

class BooleanFilter extends PolymerElement {
    static get is() {
        return 'boolean-filter';
    }

    static get properties() {
        return {
            names: {
                type: Array,
                observer: '_onNamesChanged',
                value: () => []
            },

            valueMap: {
                type: Object,
                notify: true,
                readOnly: true
            },

            singleValue: {
                type: Boolean,
                value: false
            }
        };
    }

    set(name) {
        if (this.valueMap[name] === this.singleValue) {
            return;
        }

        let valueMap = this._getDefaultMap();
        valueMap[name] = this.singleValue;
        this._setValueMap(valueMap);
    }

    _onNamesChanged() {
        this._setValueMap(this._getDefaultMap());
    }

    _getDefaultMap() {
        let valueMap = {};
        const value = !this.singleValue;
        this.names.forEach(name => valueMap[name] = value);
        return valueMap;
    }
}

customElements.define(BooleanFilter.is, BooleanFilter);
