import _ from 'lodash';
import $validators from '../_validators'

export default {
    props: {
        id: String,
        name: String,
        type: {
            type: String,
            default: 'text'
        },
        required: Boolean,
        help: String,
        value: {
            required: false
        },
        disabled: Boolean,
        label: String,
        rules: {
            type: Array,
            default: () => []
        },
        errors: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            inputId: null,
            errorBucket: [],
            tabFocused: true,
            focused: false,
            lazyValue: this.value
        }
    },
    watch: {
        value() {
            this.lazyValue = this.value;
        },
        errors(){
            this.setError(this.errors);
        }
    },
    mounted(){
        this.setError(this.errors);
    },
    computed: {
        inputGroupClasses(){
            return Object.assign({
                'input-group': true,
                'input-group--focused': this.focused,
                'input-group--dirty': this.isDirty,
                'input-group--focused': this.focused,
                'input-group--tab-focused': this.tabFocused,
                'input-group--disabled': this.disabled,
                'input-group--light': this.light || !this.dark,
                'input-group--dark': !this.light && this.dark,
                'input-group--has-error': this.hasError,
                'input-group--required': this.required
            }, this.classes);
        },
        hasError(){
            return this.errorBucket.length > 0
        },
        modifiers() {
            const modifiers = {
                lazy: false,
                number: false,
                trim: false
            }

            if (!this.$vnode.data.directives) {
                return modifiers
            }

            const model = this.$vnode.data.directives.find(i => i.name === 'model')

            if (!model) {
                return modifiers
            }

            return Object.assign(modifiers, model.modifiers)
        },
        allErrors(){
            return this.errorBucket.filter(error => typeof error === 'string');
        }
    },
    created(){
        this.inputId = this.id || 'input_' + this._uid;
    },
    methods: {
        toggle(){},
        setError(errors){
            errors = _.isArray(errors) ? errors : [errors];
            this.errorBucket = _.union(this.errorBucket, errors);
        },
        clearErrors(){
            this.errorBucket = [];
        },
        validate(){
            this.clearErrors();
            let validators = this.rules.filter(
                r => ['function', 'string'].includes(typeof r) || r instanceof RegExp
            );
            
            if(this.required) validators = _.union(['required'], validators);

            validators = validators.map(r => {
                if(typeof r === 'function') return r;
                if(typeof r === 'string') return $validators[r];
                if(r instanceof RegExp) return $validators._regexp(r);
            }).filter(r => r);

            validators.forEach(rule => {
                const valid = rule(this.lazyValue, this.setErrors);
                typeof valid === 'string' && this.setError(valid);
            });
        },
        genDetails(){
            let childrens = [];

            this.counter && childrens.push(this.genCounter());

            childrens.push(this.genMessages());

            return this.$createElement('div', {class: 'input-group__details'}, childrens);
        },
        genMessages () {
            let messages = [];

            if(this.help && this.focused && this.errorBucket.length === 0){
                messages = [this.genHelp()];
            } else {
                messages = this.errorBucket
                    .filter(e => (typeof e !== 'undefined'))
                    .slice(0, 2)
                    .map(e => this.genError(e));
            }

            return this.$createElement('transition-group', {
                class: 'input-group__messages',
                props: {
                    tag: 'div',
                    name: 'input-error'
                }
            }, messages);
        },
        genHelp () {
            return this.$createElement('div', {
                'class': 'input-group__help',
                key: this.help
            }, this.help)
        },
        genError (error) {
            return this.$createElement('div', {
                class: 'input-group__error', 
                key  : error
            }, error);
        },
        genLabel() {

            const data = {
                class: 'input__label',
                attrs: {
                    for: this.inputId
                }
            }

            return this.$createElement('label', data, this.label)
        },
        
        genInputGroup(input, data){
            const children = []

            data = Object.assign({}, {
                'class': this.inputGroupClasses,
                attrs: {
                    tabindex: this.tabindex
                },
                on: {
                    blur: () => (this.tabFocused = false),
                    click: () => (this.tabFocused = false),
                    keyup: e => {
                        if ([9, 16].includes(e.keyCode)) {
                            this.tabFocused = true
                        }

                        if (e.keyCode === 13) {
                            this.toggle()
                        }
                    }
                }
            }, data);

            children.push(
                this.$createElement('div', {
                    'class': 'input-group__input'
                }, [input])
            );

            this.prependIcon && children.unshift(this.genIcon('prepend'));

            return this.$createElement('div', data, children)
        }
    }
}