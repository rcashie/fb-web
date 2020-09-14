import './common/styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class TosPage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                    max-width: var(--page-max-width);
                    margin: 0 auto;
                    padding: 0 var(--space-medium);
                }
           </style>

            <h1 class="app__header app__header--large">
                Terms and Privacy Policy
            </h1>

            <p>
                Please read these Terms of Service completely before using framebastard.com which is owned and operated by <a class="app__hyperlink app__hyperlink--inline media-link" href="https://twitter.com/rcashie" target="_blank">@rcashie</a> (referred to as the Operator). This Agreement documents the legally binding terms and conditions attached to the use of the Site at framebastard.com.
            </p>

            <p>
                By using or accessing the Site in any way, viewing or browsing the Site, or adding your own content to the Site, you are agreeing to be bound by these Terms of Service.
            </p>

            <h2 class="app__header app__header--medium">
                Intellectual Property
            </h2>

            <p>
                The Site and all of its original content are the sole property of the Operator and are, as such, fully protected by the appropriate international copyright and other intellectual property rights laws.
            </p>


            <h2 class="app__header app__header--medium">
                Disclaimer
            </h2>

            <p>
                All the materials on framebastard.com are provided “as is”. The Operator makes no warranties, may it be expressed or implied, therefore negates all other warranties. Furthermore, the Operator does not make any representations concerning the accuracy or reliability of the use of the materials on the Site or otherwise relating to such materials or any sites linked to this Site.
            </p>

            <h2 class="app__header app__header--medium">
                Contributing
            </h2>

            <p>
                Visitors may post Content as long as it is not obscene, illegal, defamatory, threatening, infringing of intellectual property rights, invasive of privacy or injurious in any other way to third parties. Content has to be free of software viruses, political campaign, and commercial solicitation. You are entirely responsible for the content of, and any harm resulting from, that Content.
            </p>

            <p>
                The Operator reserves all rights (but not the obligation) to remove and/or edit such content. When you post your content, you grant the Operator non-exclusive, royalty-free and irrevocable right to use, reproduce, publish, modify such content throughout the world in any media.
            </p>

            <h2 class="app__header app__header--medium">
                Termination
            </h2>

            <p>
                The Operator reserves the right to terminate your access to the Site, without any advance notice.
            </p>

            <h2 class="app__header app__header--medium">
                Cookies
            </h2>

            <p>
                The Site uses cookies (which are small pieces of information that your browser stores on your computer's hard drive) to maintain your signed-in state and to compile aggregate data about site traffic and interaction so that we can offer better site experiences and tools in the future.
            </p>
        `;
    }

    static get is() {
        return 'tos-page';
    }
}

customElements.define(TosPage.is, TosPage);
