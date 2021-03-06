/**
 * Import(s)
 */

var validates = require('./validates')


/**
 * Export(s)
 */


/**
 * `v-validator` component with mixin
 */

module.exports = {
  inherit: true,

  created: function () {
    this._initValidationVariables()
    this._initOptions()
    this._mixinCustomValidates()
    this._defineProperties()
    this._defineValidationScope()
  },

  methods: {
    _getValidationNamespace: function (key) {
      return this.$options.validator.namespace[key]
    },

    _initValidationVariables: function () {
      this._validators = {}
      this._validates = validates
    },

    _initOptions: function () {
      var validator = this.$options.validator = this.$options.validator || {}
      var namespace = validator.namespace = validator.namespace || {}
      namespace.validation = namespace.validation || 'validation'
      namespace.valid = namespace.valid || 'valid'
      namespace.invalid = namespace.invalid || 'invalid'
      namespace.dirty = namespace.dirty || 'dirty'
    },

    _mixinCustomValidates: function () {
      var validates = this.$options.validator.validates
      for (var key in validates) {
        this._validates[key] = validates[key]
      }
    },

    _defineValidProperty: function (target, getter) {
      Object.defineProperty(target, this._getValidationNamespace('valid'), {
        enumerable: true,
        configurable: true,
        get: getter
      })
    },

    _defineInvalidProperty: function (target) {
      var self = this
      Object.defineProperty(target, this._getValidationNamespace('invalid'), {
        enumerable: true,
        configurable: true,
        get: function () {
          return !this[self._getValidationNamespace('valid')]
        }
      })
    },

    _defineProperties: function () {
      var $validator = this
      this._defineValidProperty(this.$parent, function () {
        var self = this
        var ret = true
        var validationName = $validator._getValidationNamespace('validation')
        var validName = $validator._getValidationNamespace('valid')

        Object.keys(this[validationName]).forEach(function (model) {
          if (!self[validationName][model][validName]) {
            ret = false
          }
        })
        return ret
      })

      this._defineInvalidProperty(this.$parent)
    },

    _defineValidationScope: function () {
      this.$parent.$add(this._getValidationNamespace('validation'), {})
    },

    _defineModelValidationScope: function (key, init) {
      var self = this
      var validationName = this._getValidationNamespace('validation')
      var dirtyName = this._getValidationNamespace('dirty')

      this[validationName].$add(key, {})
      this[validationName][key].$add(dirtyName, false)
      this._defineValidProperty(this[validationName][key], function () {
        var ret = true
        var validators = self._validators[key]
        validators.forEach(function (validator) {
          if (self[validationName][key][validator.name]) {
            ret = false
          }
        })
        return ret
      })
      this._defineInvalidProperty(this[validationName][key])
      
      this._validators[key] = []

      this._watchModel(key, function (val, old) {
        self._doValidate(key, init, val)
      })
    },

    _defineValidatorToValidationScope: function (target, validator) {
      this[this._getValidationNamespace('validation')][target].$add(validator, null)
    },

    _addValidators: function (target, validator, arg) {
      this._validators[target].push({ name: validator, arg: arg })
    },

    _watchModel: function (key, fn) {
      this.$watch(key, fn, false, true)
    },

    _doValidate: function (model, init, val) {
      var self = this
      var validationName = this._getValidationNamespace('validation')
      var dirtyName = this._getValidationNamespace('dirty')

      this[validationName][model][dirtyName] = (init !== val)
      this._validators[model].forEach(function (validator) {
        self[validationName][model][validator.name] = 
          !self._validates[validator.name].call(self, val, validator.arg)
      })
    }
  }
}
