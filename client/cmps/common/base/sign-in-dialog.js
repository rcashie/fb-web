import '../styles/app-styles.js';
import './base-button.js';
import './modal-dialog.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class SignInDialog extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                .body {
                    display: flex;
                }

                .body__image {
                    align-self: center;
                    flex-grow: 0;
                    flex-shrink: 0;
                    margin-right: var(--space-section);
                }

                @media (max-width: 25rem) {
                    .body__image {
                        display: none;
                    }
                }

                .body__content {
                    display: flex;
                    flex-flow: column nowrap;
                    justify-content: space-between;
                    font-size: var(--font-size-header-medium);
                }

                .body__message {
                    margin: 0
                }

                .body__agreement {
                    margin: var(--space-large) 0 0 0;
                }

                .sign-in {
                    display: flex;
                    flex-flow: row nowrap;
                    align-items: center;
                    font-weight: var(--font-weight-bold);
                }

                .sign-in__icon {
                    width: 1rem;
                    height: 1rem;
                    margin-right: var(--space-small);
                }

                .footer {
                    display: flex;
                    flex-flow: row wrap;
                    justify-content: flex-end;
                }

                .footer__button {
                    margin-left: var(--space-medium);
                }
            </style>

            <modal-dialog
                id="modal"
                shown="{{_shown}}"
            >
                <template
                    is="dom-if"
                    if="[[_shown]]"
                >
                    <div
                        slot="body"
                        class="body"
                    >
                        <!-- TODO: Make the alt string localizable -->
                        <img
                            class="body__image"
                            src="/static/images/message-success.png"
                            alt="Message characterization"
                        />

                        <!-- TODO: Make string localizable -->
                        <div class="body__content">
                            <p class="body__message">
                                Sign in using Twitter so that you can be recognized for your contribution.
                            </p>

                            <p class="body__agreement">
                                <input
                                    id="agreement"
                                    type="checkbox"
                                    checked="{{_tosAgreed::change}}"
                                >

                                <label for="agreement">
                                    I have read and agree to the
                                    <a
                                        class="app__hyperlink app__hyperlink--inline"
                                        href="/tos"
                                        target="_blank"
                                    >
                                        terms of service
                                    </a>
                                </label>
                            </p>
                        </div>
                    </div>

                    <div
                        slot="footer"
                        class="footer"
                    >
                        <base-button
                            disabled="[[!_tosAgreed]]"
                            on-click="_onSignInClicked"
                        >
                            <div class="sign-in">
                                <img
                                    class="sign-in__icon"
                                    src="/static/images/twitter-icon.svg"
                                    alt=""
                                />

                                <!-- TODO: Make string localizable -->
                                Sign in with Twitter
                            </div>
                        </base-button>

                        <base-button
                            class="footer__button"
                            on-click="_onCancelClicked"
                        >
                            <!-- TODO: Make string localizable -->
                            Cancel
                        </base-button>
                    </div>
                </template>
            </modal-dialog>
        `;
    }

    static get is() {
        return 'sign-in-dialog';
    }

    static get properties() {
        return {
            cancelUrl: {
                type: String,
            },

            _tosAgreed: {
                type: Boolean,
                value: false
            },

            _shown: {
                type: Boolean
            }
        };
    }

    show() {
        this.$.modal.show();
    }

    _onCancelClicked() {
        this.$.modal.hide();

        if (this.cancelUrl) {
            window.history.pushState({}, null, this.cancelUrl);
            window.dispatchEvent(new CustomEvent('location-changed'));
        }
    }

    _onSignInClicked(event) {
        if (this._tosAgreed) {
            window.location.href = '/auth/login';
        } else {
            event.stopPropagation();
        }
    }
}

customElements.define(SignInDialog.is, SignInDialog);
