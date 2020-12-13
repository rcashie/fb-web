import '../../common/base/base-button.js';
import '../../common/styles/app-styles.js';
import './name-editor.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';

class NameSetEditor extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .set {
                    display: flex;
                    flex-flow: row wrap;
                    font-size: var(--font-size-small);
                }

                .set__item {
                    margin: var(--space-medium) var(--space-medium) 0 0;
                }
            </style>

            <slot></slot>
            <div class="set">
                <template
                    is="dom-repeat"
                    items="{{names}}"
                >
                    <name-editor
                        id="name__[[index]]"
                        class="set__item"
                        value="{{item}}"
                        on-remove="_onRemoved"
                    >
                    </name-editor>
                </template>

                <!-- TODO: Make this string localizable -->
                <base-button
                    class="set__item"
                    on-click="_onNewClicked"
                >
                    + Add Alias
                </base-button>
            </div>
        `;
    }

    static get is() {
        return 'name-set-editor';
    }

    static get properties() {
        return {
            names: {
                type: Array,
                notify: true,
                value: () => []
            },

            _debounceJob: {
                type: Object
            }
        };
    }

    _onNewClicked() {
        this.push('names', '');
        const callback = () => {
            let nameElement = this.shadowRoot.querySelector(`#name__${this.names.length - 1}`);
            nameElement.showEdit();
        };

        this._debounceJob = Debouncer.debounce(
            this._debounceJob,
            timeOut.after(0),
            callback
        );
    }

    _onRemoved(event) {
        const index = event.model.index;
        this.splice('names', index, 1);
    }
}

customElements.define(NameSetEditor.is, NameSetEditor);

export { NameSetEditor };
