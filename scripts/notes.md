# Como documentar
http://usejsdoc.org/about-getting-started.html
```js
/**
 * @file Working with Tags
 * @author Milton Mazzarri <me@milmazz.uno>
 * @version 0.1
 */

/**
   * The Tag definition.
   *
   * @param {String} id - The ID of the Tag.
   * @param {String} description - Concise description of the tag.
   * @param {Number} min - Minimum value accepted for trends.
   * @param {Number} max - Maximum value accepted for trends.
   * @param {Object} plc - The ID of the {@link PLC} object where this tag belongs.
   */
	 /**
	      * Get the current value of the tag.
	      *
	      * @see [Example]{@link http://example.com}
	      * @returns {Number} The current value of the tag.
	      */
/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */

 /**
  * Execute the generator function or a generator
  * and return a promise.
  *
  * @param {Function} fn
  * @return {Promise}
  * @api public
  */

/**
    * @param {Error} err
    * @return {Promise}
    * @api private
    */


/**
   * Get the next value in the generator,
   * return a promise.
   *
   * @param {Object} ret
   * @return {Promise}
   * @api private
   */

/**
* Convert a `yield`ed value into a promise.
*
* @param {Mixed} obj
* @return {Promise}
* @api private
*/

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

 /**
  * Convert an array of "yieldables" to a promise.
  * Uses `Promise.all()` internally.
  *
  * @param {Array} obj
  * @return {Promise}
  * @api private
  */
```

# Package
"start": "export $(cat .env | xargs) && node ./bin/www",
"set_env": "export $(cat .env | xargs)",
"switch_to_dev": "export $(cat .env | xargs) && wget --spider https://api.telegram.org/bot$TOKEN/setWebhook?url= --delete-after && node ./bin/www"