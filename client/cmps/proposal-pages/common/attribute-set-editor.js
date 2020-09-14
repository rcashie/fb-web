import '../../common/base/base-button.js';
import '../../common/base/radio-group.js';
import '../../common/base/text-input.js';
import '../../common/styles/app-styles.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';

class AttributeSetEditor extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .attribute {
                    display: flex;
                    flex-flow: row wrap;
                    justify-content: space-between;
                    padding: var(--space-large);
                    margin: 0 0 var(--space-large) 0;
                    overflow: hidden;
                }

                .attribute__fields {
                    border: none;
                    margin: 0;
                    padding: 0;
                }

                .attribute__text {
                    margin: 0 0 var(--space-medium) 0;
                }

                .attribute__button-container {
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    flex-grow: 1;
                    padding-top: var(--space-medium);
                }

                .add-button-container {
                    display: flex;
                    justify-content: center;
                }
            </style>

            <template
                is="dom-repeat"
                items="{{attributes}}"
            >
                <div class="app__container app__bordered attribute">
                    <fieldset class="attribute__fields">

                        <!-- TODO: Make this label localizable -->
                        <text-input
                            id="attributeTitle__[[index]]"
                            class="attribute__text"
                            value="{{item.title}}"
                            placeholder="[[titlePlaceholder]]"
                            required
                            on-valid-changed="_onValidChanged"
                        >
                            Title
                        </text-input>

                        <!-- TODO: Make this label localizable -->
                        <text-input
                            id="attributeValue__[[index]]"
                            class="attribute__text"
                            value="{{item.value}}"
                            placeholder="[[valuePlaceholder]]"
                            required
                            on-valid-changed="_onValidChanged"
                        >
                            Value
                        </text-input>

                        <!-- TODO: Make this string localizable -->
                        <radio-group
                            class="attribute__radio-group"
                            options="[[_radioOptions]]"
                            value="{{item.sentiment}}"
                        >
                            Sentiment
                        </radio-group>
                    </fieldset>

                    <!-- TODO: Make this string localizable -->
                    <div class="attribute__button-container">
                        <base-button
                            data-attribute-index\$="[[index]]"
                            on-click="_onRemoveAttributeClicked"
                        >
                            Remove
                        </base-button>
                    </div>
                </div>
            </template>

            <!-- TODO: Make this string localizable -->
            <div class="add-button-container">
                <base-button on-click="_onNewAttributeClicked">
                    + Add Attribute
                </base-button>
            </div>
        `;
    }

    static get is() {
        return 'attribute-set-editor';
    }

    static get properties() {
        return {
            attributes: {
                type: Array,
                notify: true,
                value: () => []
            },

            titlePlaceholder: {
                type: String,
                value: ''
            },

            valuePlaceholder: {
                type: String,
                value: ''
            },

            valid: {
                type: Boolean,
                value: false,
                readOnly: true,
                notify: true
            },

            _radioOptions: {
                type: Array,
                readOnly: true,
                value: () => {
                    // TODO: Make these labels localizable
                    return [
                        { value: 'neutral', label: 'Neutral' },
                        { value: 'positive', label: 'Positive' },
                        { value: 'negative', label: 'Negative' }
                    ];
                }
            },

            _debounceJob: {
                type: Object
            }
        };
    }

    static createBlankAttribute() {
        return {
            title: '',
            value: '',
            sentiment: 'neutral'
        };
    }

    _getAttributesValidity() {
        return this.attributes.map((attribute, index) => {
            const titleElement = this.shadowRoot.querySelector(`#attributeTitle__${index}`);
            const valueElement = this.shadowRoot.querySelector(`#attributeValue__${index}`);
            return titleElement.valid && valueElement.valid;
        });
    }

    _onValidChanged() {
        const callback = () => {
            const validArray = this._getAttributesValidity();
            this._setValid(validArray.every(value => value));
        };

        this._debounceJob = Debouncer.debounce(
            this._debounceJob,
            timeOut.after(250),
            callback
        );
    }

    _onNewAttributeClicked() {
        this.push(
            'attributes',
            AttributeSetEditor.createBlankAttribute()
        );

        this._setValid(false);
    }

    _onRemoveAttributeClicked(event) {
        const index = event.model.index;
        let validArray = this._getAttributesValidity();
        validArray.splice(index, 1);

        this.splice('attributes', index, 1);
        this._setValid(validArray.every(value => value));
    }
}

customElements.define(AttributeSetEditor.is, AttributeSetEditor);

export { AttributeSetEditor };
