import '../styles/app-styles.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class NameSet extends PolymerElement {
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
                    align-content: center;
                    font-size: var(--font-size-small);
                }

                .set__name {
                    padding: var(--space-x-small) var(--space-medium);
                    margin: var(--space-medium) var(--space-medium) 0 0;
                }
            </style>

            <section class="set">
                <template
                    is="dom-repeat"
                    items="[[names]]"
                >
                    <div class="app__container app__bordered set__name">
                        [[item]]
                    </div>
                </template>
            </section>
        `;
    }

    static get is() {
        return 'name-set';
    }

    static get properties() {
        return {
            names: {
                type: Array,
                value: () => []
            }
        };
    }
}

customElements.define(NameSet.is, NameSet);

export { NameSet };
