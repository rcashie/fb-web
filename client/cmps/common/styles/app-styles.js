const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `
<dom-module id="app-styles">
    <template>
        <style>
            .app__hyperlink {
                color: inherit;
                text-decoration: none;
                font-weight: var(--font-weight-bold);
            }

            .app__hyperlink--inline {
                color: var(--color-text-hyperlink);
            }

            .app__bare-button {
                cursor: pointer;
                padding: 0;
                margin: 0;
                font: inherit;
                border: none;
                background-color: transparent;
            }

            .app__header {
                font-weight: var(--font-weight-bold);
                margin: var(--space-small) 0;
            }

            .app__header--medium {
                font-size: var(--font-size-header-medium);
                margin: var(--space-medium) 0;
            }

            .app__header--large {
                font-size: var(--font-size-header-large);
                margin: var(--space-large) 0;
            }

            .app__container {
                border-radius: var(--border-radius);
            }

            .app__bordered {
                border: var(--border-size) solid var(--color-border);
            }

            .app__bordered--dashed {
                border-style: dashed;
            }

            .app__shadowed {
                box-shadow: 0 var(--space-x-small) var(--space-medium) var(--color-border);
            }

            .app__heavy-shadowed {
                box-shadow: 0 var(--space-x-small) var(--space-medium) var(--color-darker-border);
            }

            .app__media--small {
                height: var(--media-height-small);
            }

            .app__media--large {
                height: var(--media-height-large);
            }

            .app__theme--game {
                background-color: var(--color-game);
            }

            .app__theme--character {
                background-color: var(--color-char);
            }

            .app__theme--move {
                background-color: var(--color-move);
            }

            .app__theme--inactive {
                background-color: var(--color-page-alt);
            }

            .app__sentiment-neutral {
                background-color: var(--color-sentiment-neutral);
            }

            .app__sentiment-positive {
                background-color: var(--color-sentiment-positive);
            }

            .app__sentiment-negative {
                background-color: var(--color-sentiment-negative);
            }

            .app__section {
                margin-bottom: var(--space-section);
            }
        </style>
    </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
