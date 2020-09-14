import '../../common/base/base-button.js';
import '../../common/styles/app-styles.js';
import './tag-editor.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';

class TagSetEditor extends PolymerElement {
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
                    items="{{tags}}"
                >
                    <tag-editor
                        id="tag__[[index]]"
                        class="set__item"
                        value="{{item}}"
                        on-remove="_onTagRemoved"
                    >
                    </tag-editor>
                </template>

                <!-- TODO: Make this string localizable -->
                <base-button
                    class="set__item"
                    on-click="_onNewClicked"
                >
                    + Add Tag
                </base-button>
            </div>
        `;
    }

    static get is() {
        return 'tag-set-editor';
    }

    static get properties() {
        return {
            tags: {
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
        this.push('tags', '');
        const callback = () => {
            let tagElement = this.shadowRoot.querySelector(`#tag__${this.tags.length - 1}`);
            tagElement.showEdit();
        };

        this._debounceJob = Debouncer.debounce(
            this._debounceJob,
            timeOut.after(0),
            callback
        );
    }

    _onTagRemoved(event) {
        const index = event.model.index;
        this.splice('tags', index, 1);
    }
}

customElements.define(TagSetEditor.is, TagSetEditor);

export { TagSetEditor };
