'use strict';

const RequestHelper = require('Client/Helpers/RequestHelper');

/**
 * A Template editor
 *
 * @memberof HashBrown.Client.Views.Editors
 */
class TemplateEditor extends Crisp.View {
    /**
     * Constructor
     */
    constructor(params) {
        super(params);

        this.fetch();
    }

    /**
     * Event: Click save. Posts the model to the apiPath
     */
    onClickSave() {
        this.$saveBtn.toggleClass('working', true);

        RequestHelper.request('post', 'templates/' + this.model.type + '/' + this.model.name, this.model)
        .then(() => {
            return RequestHelper.reloadResource('templates');
        })
        .then(() => {
            HashBrown.Views.Navigation.NavbarMain.reload();

            this.$saveBtn.toggleClass('working', false);
        })
        .catch(UI.errorModal);
    }

    /**
     * Event: Change text. Make sure the value is up to date
     */
    onChangeText() {
        this.model.markup = this.editor.getDoc().getValue();

        this.trigger('change', this.model);
    }

    /**
     * Gets the current highlight mode
     *
     * @returns {String} Mode
     */
    getMode() {
        if(this.model.name.indexOf('html') > -1) {
            return 'xml';
        }

        if(this.model.name.indexOf('.js') > -1) {
            return 'javascript';
        }
        
        if(this.model.name.indexOf('.pug') > -1 || this.model.name.indexOf('.jade') > -1) {
            return 'pug';
        }
    }

    /**
     * Renders this editor
     */
    template() {
        return _.div({class: 'editor editor--template'},
            _.div({class: 'editor__header'},
                _.span({class: 'editor__header__icon fa fa-code'}),
                _.h4({class: 'editor__header__title'}, this.model.name)
            ),
            _.div({class: 'editor__body'},
                _.textarea()
            ),
			_.if(!this.model.isLocked,
				_.div({class: 'editor__footer'}, 
					_.div({class: 'editor__footer__buttons'},
                        // Save
                        this.$saveBtn = _.button({class: 'widget widget--button'},
                            _.span({class: 'widget--button__text-default'}, 'Save'),
                            _.span({class: 'widget--button__text-working'}, 'Saving')
                        ).click(() => { this.onClickSave(); })
                    )
                )
            )
        );
    }

    /**
     * Post render
     */
    postrender() {
        setTimeout(() => {
            this.editor = CodeMirror.fromTextArea(this.element.querySelector('textarea'), {
                lineNumbers: true,
                mode: {
                    name: this.getMode(),
                },
                viewportMargin: this.embedded ? Infinity : 10,
                tabSize: 4,
                indentUnit: 4,
                indentWithTabs: true,
                theme: getCookie('cmtheme') || 'default',
                value: this.model.markup
            });

            this.editor.getDoc().setValue(this.model.markup);

            this.editor.on('change', () => { this.onChangeText(); });

            this.onChangeText();
        }, 1);
    }
}

module.exports = TemplateEditor;
