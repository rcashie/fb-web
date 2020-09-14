import '../styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class ModalDialog extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    --color-modal-background: rgba(0, 0, 0, 0.5);
                }

                .modal:not([hidden]) {
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: center;
                    align-items: center;
                    position: fixed;
                    z-index: 1;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: var(--color-modal-background);
                }

                .dialog {
                    background-color: var(--color-page);
                    overflow: hidden;
                    max-width: var(--page-max-width);
                    width: 100%;
                    margin: 0 var(--space-large);
                }

                .dialog__body {
                    padding: var(--space-section);
                }

                .dialog__header {
                    padding: var(--space-medium);
                }

                .dialog__footer {
                    padding: var(--space-large);
                    background-color: var(--color-page-alt);
                }
            </style>

            <div
                class="modal"
                hidden="[[!shown]]"
            >
                <article
                    class="app__container app__heavy-shadowed dialog"
                    role="dialog"
                >
                    <header class="dialog__header">
                        <slot name="header"></slot>
                    </header>
                    <section class="dialog__body">
                        <slot name="body"></slot>
                    </section>
                    <footer class="dialog__footer">
                        <slot name="footer"></slot>
                    </footer>
                </article>
            </div>
        `;
    }

    static get is() {
        return 'modal-dialog';
    }

    static get properties() {
        return {
            shown: {
                type: Boolean,
                notify: true,
                readOnly: true,
                value: false
            }
        };
    }

    static _toggleModalTag() {
        // Prevents scrolling while the modal is open
        document.querySelector('body').classList.toggle('modal-open');
    }

    show() {
        this._setShown(true);
        ModalDialog._toggleModalTag();
    }

    hide() {
        this._setShown(false);
        ModalDialog._toggleModalTag();
    }
}

customElements.define(ModalDialog.is, ModalDialog);
