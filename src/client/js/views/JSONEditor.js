'use strict';

// Lib
let beautify = require('js-beautify').js_beautify;

// Views
let MessageModal = require('./MessageModal');

/**
 * A basic JSON editor for any object
 */
class JSONEditor extends View {
    constructor(params) {
        super(params);

        this.$element = _.div({class: 'json-editor flex-vertical'});
        this.$error = _.div({class: 'panel panel-danger'},
            _.div({class: 'panel-heading'}),
            _.div({class: 'panel-body'})
        ).hide();

        this.fetch();
    }

    /**
     * Event: Successful API call
     */
    onSuccess() {
    
    }

    /**
     * Event: Failed API call
     */
    onError(e) {
        alert(e);
    }

    /**
     * Event: Click basic. Returns to the regular editor
     */
    onClickBasic() {
        let url = $('.navbar-main .pane-container.active .pane-item-container.active .pane-item').attr('href');
    
        if(url) {
            location = url;
        } else {
            debug.log('Invalid url "' + url + '"', this);
        }
    }

    /**
     * Event: Click save. Posts the model to the apiPath
     */
    onClickSave() {
        let view = this;

        if(this.debug()) {
            apiCall('post', this.apiPath, this.model)
            .then(this.onSuccess)
            .catch(this.onError);
       
        } else {
            new MessageModal({
                model: {
                    title: 'Unable to save',
                    body: 'Please refer to the error prompt for details'
                }
            });

        }
    }

    /**
     * Event: Click beautify button
     */
    onClickBeautify() {
        try {
            this.value = beautify(this.value);
            this.$element.find('textarea').val(this.value);
        
        } catch(e) {
            this.$error.children('.panel-heading').html('JSON error');
            this.$error.children('.panel-body').html(e);
            this.$error.show();

        }
    }

    /**
     * Debug the JSON string
     */
    debug() {
        // Function for recursing through object
        let recurse = (obj, check) => {
            if(obj instanceof Object) {
                for(let k in obj) {
                    let v = obj[k];

                    let failMessage = check(k, v);
                    
                    if(failMessage != true) {
                        this.$error.children('.panel-heading').html('Schema error');
                        this.$error.children('.panel-body').html(failMessage);
                        this.$error.show();
                    
                        return false;
                    };

                    recurse(v, check);
                }

                return false;
            }

            return true;
        }
        
        // Hide error message initially
        this.$error.hide();

        // Syntax check
        try {
            this.model = JSON.parse(this.value);

        } catch(e) {
            this.$error.children('.panel-heading').html('JSON error');
            this.$error.children('.panel-body').html(e);
            this.$error.show();

            return false;
        }

        // Schema check
        return recurse(this.model, (k, v) => {
            switch(k) {
                case 'schemaId': case 'parentSchemaId':
                    for(let id in resources.schemas) {
                        if(id == v) {
                            return true;
                        }
                    }   

                    return 'Schema "' + v + '" not found';
            }

            return true;
        });
    }

    /**
     * Event: Change text. Make sure the value is up to date
     */
    onChangeText() {
        this.value = this.$element.find('textarea').val();

        let $lineNumbers = this.$element.find('.line-numbers');

        $lineNumbers.empty();

        for(let i = 0; i < this.value.split(/\r\n|\r|\n/).length; i++) {
            $lineNumbers.append(i + '<br />');
        }

        this.debug();
    }

    render() {
        this.value = beautify(JSON.stringify(this.model));

        this.$element.html([
            _.div({class: 'editor-container'},
                _.div({class: 'line-numbers'}),
                _.textarea({class: 'flex-expand', disabled: this.model.locked},
                    this.value
                )
                .on('keydown', (e) => { if(e.which == 9) { e.preventDefault(); return false; } })
                .on('keyup change propertychange paste', (e) => { return this.onChangeText(); }),
                this.$error
            ),
            _.div({class: 'panel panel-default panel-buttons'}, 
                _.button({class: 'btn btn-default btn-raised'},
                    _.span('{ }')
                ).click(() => { this.onClickBeautify(); }),
                _.div({class: 'btn-group'},
                    _.button({class: 'btn btn-embedded'},
                        'Basic'
                    ).click(() => { this.onClickBasic(); }),
                    _.if(!this.model.locked,
                        _.button({class: 'btn btn-raised btn-success'},
                            'Save '
                        ).click(() => { this.onClickSave(); })
                    )
                )
            )
        ]);

        this.onChangeText();
    }
}

module.exports = JSONEditor;
