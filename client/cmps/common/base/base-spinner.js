import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
class BaseSpinner extends PolymerElement {
    static get template() {
        return html`
            <style>
                :host {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                }

                :host([hidden]) {
                    display: none;
                }

                .spinner {
                    width: 4rem;
                    height: auto;
                }
           </style>

            <!-- TODO: Make the alt string localizable -->
            <img
                class="spinner"
                src="/static/images/spinner.svg"
                alt="Animated spinner"
            />
        `;
    }

    static get is() {
        return 'base-spinner';
    }
}

customElements.define(BaseSpinner.is, BaseSpinner);
