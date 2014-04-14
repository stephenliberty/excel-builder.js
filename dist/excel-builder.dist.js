(function (root) {
    
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

define('Excel/XMLDOM.js',['underscore'], function (_) {
    
    var XMLDOM = function (ns, rootNodeName, documentType) {
        this.documentElement = this.createElement(rootNodeName);
        this.documentElement.setAttribute('xmlns', ns);
    };
    
    _.extend(XMLDOM.prototype, {
        createElement: function (name) {
            return new XMLDOM.XMLNode({
                nodeName: name
            });
        },
        createTextNode: function (text) {
            return new XMLDOM.TextNode(text);
        },
        toString: function () {
            return this.documentElement.toString();
        }
    });
    
    XMLDOM.Node = function () {};
    XMLDOM.Node.Create = function (config) {
        switch(config.type) {
            case "XML":
                return new XMLDOM.XMLNode(config);
                break;
            case "TEXT":
                return new XMLDOM.TextNode(config.nodeValue);
                break;
        }
    }
    
    XMLDOM.TextNode = function (text) {
        this.nodeValue = text;
    };
     _.extend(XMLDOM.TextNode.prototype, {
         toJSON: function () {
             return {
                 nodeValue: this.nodeValue,
                 type: 'TEXT'
             };
         },
        toString: function () {
            return _.escape(this.nodeValue);
        }
     });
    
    XMLDOM.XMLNode = function (config) {
        this.nodeName = config.nodeName;
        this.children = [];
        this.nodeValue = config.nodeValue || "";
        this.attributes = {};
        
        if(config.children) {
            for(var i = 0; i < config.children.length; i++) {
                this.appendChild(XMLDOM.Node.Create(config.children[i]));
            }
        }
        
        if(config.attributes) {
            for(var attr in config.attributes) {
                this.setAttribute(attr, config.attributes[attr]);
            }
        }
    };
    _.extend(XMLDOM.XMLNode.prototype, {
        
        toString: function () {
            var string = "<" + this.nodeName;
			var attrs = [];
            for(var attr in this.attributes) {
                attrs.push(attr + "=\""+_.escape(this.attributes[attr])+"\"");
            }
            if (attrs.length > 0){
				string+= " " + attrs.join(" ");
            }

            var childContent = "";
            for(var i = 0, l = this.children.length; i < l; i++) {
				childContent += this.children[i].toString();
            }

            if (childContent){
				string +=  ">" + childContent + "</" + this.nodeName + ">";
            } else {
				string += "/>";
            }

            return string;
        },
        
        toJSON: function () {
            var children = [];
            for(var i = 0, l = this.children.length; i < l; i++) {
                children.push(this.children[i].toJSON());
            }
            return {
                nodeName: this.nodeName,
                children: children,
                nodeValue: this.nodeValue,
                attributes: this.attributes,
                type: "XML"
            };
        },
        
        setAttribute: function (name, val) {
            if(val === null) {
                delete this.attributes[name];
                delete this[name];
                return;
            }
            this.attributes[name] = val;
            this[name] = val;
        },
        setAttributeNS: function (ns, name, val) {
            this.setAttribute(name, val);
        },
        appendChild: function (child) {
            this.children.push(child);
            this.firstChild = this.children[0];
        },
        cloneNode: function () {
            return new XMLDOM.XMLNode(this.toJSON());
        }
    });
    
    return XMLDOM;
});

/**
 * @module Excel/util
 */
define('Excel/util.js',['./XMLDOM'], function (XMLDOM) {
    var util = {
        
        _idSpaces: {},
        
        /**
         * Returns a number based on a namespace. So, running with 'Picture' will return 1. Run again, you will get 2. Run with 'Foo', you'll get 1.
         * @param {String} space
         * @returns {Number}
         */
        uniqueId: function (space) {
            if(!this._idSpaces[space]) {
                this._idSpaces[space] = 1;
            }
            return this._idSpaces[space]++;
        },
        
        /**
         * Attempts to create an XML document. Due to limitations in web workers, 
         * it may return a 'fake' xml document created from the XMLDOM.js file. 
         * 
         * Takes a namespace to start the xml file in, as well as the root element
         * of the xml file. 
         * 
         * @param {type} ns
         * @param {type} base
         * @returns {ActiveXObject|@exp;document@pro;implementation@call;createDocument|@new;XMLDOM}
         */
        createXmlDoc: function (ns, base) {
            if(typeof document === 'undefined') {
                return new XMLDOM(ns || null, base, null);
            }
            if(document.implementation && document.implementation.createDocument) {
                return document.implementation.createDocument(ns || null, base, null);
            } else if (window.ActiveXObject) {
                var doc = new ActiveXObject( "Microsoft.XMLDOM" );
                var rootNode = doc.createElement(base);
                rootNode.setAttribute('xmlns', ns);
                doc.appendChild(rootNode);
                return doc;
            }
            throw "No xml document generator";
        },
        
        /**
         * Creates an xml node (element). Used to simplify some calls, as IE is
         * very particular about namespaces and such. 
         * 
         * @param {XMLDOM} doc An xml document (actual DOM or fake DOM, not a string)
         * @param {type} name The name of the element
         * @param {type} attributes
         * @returns {XML Node}
         */
        createElement: function (doc, name, attributes) {
            var el = doc.createElement(name);
            var ie = !el.setAttributeNS
            attributes = attributes || [];
            var i = attributes.length;
            while (i--) {
                if(!ie && attributes[i][0].indexOf('xmlns') != -1) {
                    el.setAttributeNS("http://www.w3.org/2000/xmlns/", attributes[i][0], attributes[i][1])
                } else {
                    el.setAttribute(attributes[i][0], attributes[i][1])
                }
            }
            return el;
        },
        
        LETTER_REFS: {},
	
        positionToLetterRef: function (x, y) {
            var digit = 1, index, num = x, string = "", alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            if(this.LETTER_REFS[x]) {
                return this.LETTER_REFS[x].concat(y);
            }
            while (num > 0) {
                num -= Math.pow(26, digit -1)
                index = num % Math.pow(26, digit)
                num -= index
                index = index / Math.pow(26, digit - 1)
                string = alphabet.charAt(index) + string
                digit += 1
            }
            this.LETTER_REFS[x] = string;
            return string.concat(y);
        },
		
        schemas: {
            'worksheet': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet',
            'sharedStrings': "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings",
            'stylesheet': "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
            'relationships': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            'relationshipPackage': "http://schemas.openxmlformats.org/package/2006/relationships",
            'contentTypes': "http://schemas.openxmlformats.org/package/2006/content-types",
            'spreadsheetml': "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
            'markupCompat': "http://schemas.openxmlformats.org/markup-compatibility/2006",
            'x14ac': "http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac",
            'officeDocument': "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
            'package': "http://schemas.openxmlformats.org/package/2006/relationships",
            'table': "http://schemas.openxmlformats.org/officeDocument/2006/relationships/table",
            'spreadsheetDrawing': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
            'drawing': 'http://schemas.openxmlformats.org/drawingml/2006/main',
            'drawingRelationship': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing',
            'image': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            'chart': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart'
        }
    };
	
    return util;
});

/**
 * This is mostly a global spot where all of the relationship managers can get and set
 * path information from/to. 
 * @module Excel/Paths
 */
define('Excel/Paths.js',{});

/**
 * @module Excel/RelationshipManager
 */
define('Excel/RelationshipManager.js',['underscore', './util', './Paths'], function (_, util, Paths) {
    var RelationshipManager = function () {
        this.relations = {};
        this.lastId = 1;
    };
    
    _.uniqueId('rId'); //priming
    
    _.extend(RelationshipManager.prototype, {
        
        importData: function (data) {
            this.relations = data.relations;
            this.lastId = data.lastId;
        },
        exportData: function () {
            return {
                relations: this.relations,
                lastId: this.lastId
            };
        },
        
        addRelation: function (object, type) {
            this.relations[object.id] = {
                id: _.uniqueId('rId'),
                schema: util.schemas[type]
            };
            return this.relations[object.id].id;
        },
        
        getRelationshipId: function (object) {
            return this.relations[object.id] ? this.relations[object.id].id : null;
        },
		
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.relationshipPackage, 'Relationships');
            var relationships = doc.documentElement;
            
            _.each(this.relations, function (data, id) {
                var relationship = util.createElement(doc, 'Relationship', [
                    ['Id', data.id],
                    ['Type', data.schema],
                    ['Target', Paths[id]]
                ]);
                relationships.appendChild(relationship);
            });
            return doc;
        }
    });
    
    return RelationshipManager;
});

/**
 * @module Excel/Drawings
 */
define('Excel/Drawings.js',['underscore', './RelationshipManager', './util'], function (_, RelationshipManager, util) {
    var Drawings = function () {
        this.drawings = [];
        this.relations = new RelationshipManager();
        this.id = _.uniqueId('Drawings');
    };
    
    _.extend(Drawings.prototype, {
        /**
         * Adds a drawing (more likely a subclass of a Drawing) to the 'Drawings' for a particular worksheet.
         * 
         * @param {Drawing} drawing
         * @returns {undefined}
         */
        addDrawing: function (drawing) {
            this.drawings.push(drawing);
        },
        getCount: function () {
            return this.drawings.length;
        },
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetDrawing, 'xdr:wsDr');
            var drawings = doc.documentElement;
//            drawings.setAttribute('xmlns:xdr', util.schemas.spreadsheetDrawing);
            drawings.setAttribute('xmlns:a', util.schemas.drawing);
            
            var existingRelationships = {};
            
            for(var i = 0, l = this.drawings.length; i < l; i++) {
                
                var rId = this.relations.getRelationshipId(this.drawings[i].getMediaData());
                if(!rId) {
                    rId = this.relations.addRelation(this.drawings[i].getMediaData(), this.drawings[i].getMediaType()); //chart
                }
                this.drawings[i].setRelationshipId(rId);
                drawings.appendChild(this.drawings[i].toXML(doc));
            }
            return doc;
        }
    });
    
    return Drawings;
});
define('Excel/Drawings/AbsoluteAnchor',['underscore', '../util'], function (_, util) {
    /**
     * 
     * @param {Object} config
     * @param {Number} config.x X offset in EMU's
     * @param {Number} config.y Y offset in EMU's
     * @param {Number} config.width Width in EMU's
     * @param {Number} config.height Height in EMU's
     * @constructor
     */
    AbsoluteAnchor = function (config) {
        this.x = null;
        this.y = null;
        this.width = null;
        this.height = null;
        if(config) {
            this.setPos(config.x, config.y);
            this.setDimensions(config.width, config.height);
        }
    };
    _.extend(AbsoluteAnchor.prototype, {
        /**
         * Sets the X and Y offsets.
         * 
         * @param {Number} x
         * @param {Number} y
         * @returns {undefined}
         */
        setPos: function (x, y) {
            this.x = x;
            this.y = y;
        },
        /**
         * Sets the width and height of the image.
         * 
         * @param {Number} width
         * @param {Number} height
         * @returns {undefined}
         */
        setDimensions: function (width, height) {
            this.width = width;
            this.height = height;
        },
        toXML: function (xmlDoc, content) {
            var root = util.createElement(xmlDoc, 'xdr:absoluteAnchor');
            var pos = util.createElement(xmlDoc, 'xdr:pos');
            pos.setAttribute('x', this.x);
            pos.setAttribute('y', this.y);
            root.appendChild(pos);
            
            var dimensions = util.createElement(xmlDoc, 'xdr:ext');
            dimensions.setAttribute('cx', this.width);
            dimensions.setAttribute('cy', this.height);
            root.appendChild(dimensions);
            
            root.appendChild(content);
            
            root.appendChild(util.createElement(xmlDoc, 'xdr:clientData'));
            return root;
        }
    });
    return AbsoluteAnchor;
});
define('Excel/Drawings/Chart.js',['underscore', '../util'], function (_, util) {
    Chart = function (config) {
        
    };
    _.extend(Chart.prototype, {
        
    });
    return Chart;
});
define('Excel/Drawings/OneCellAnchor.js',['underscore', '../util'], function (_, util) {
    /**
     * 
     * @param {Object} config
     * @param {Number} config.x The cell column number that the top left of the picture will start in
     * @param {Number} config.y The cell row number that the top left of the picture will start in
     * @param {Number} config.width Width in EMU's
     * @param {Number} config.height Height in EMU's
     * @constructor
     */
    OneCellAnchor = function (config) {
        this.x = null;
        this.y = null;
        this.xOff = null;
        this.yOff = null;
        this.width = null;
        this.height = null;
        if(config) {
            this.setPos(config.x, config.y, config.xOff, config.yOff);
            this.setDimensions(config.width, config.height);
        }
    };
    _.extend(OneCellAnchor.prototype, {
        setPos: function (x, y, xOff, yOff) {
            this.x = x;
            this.y = y;
            if(xOff !== undefined) {
                this.xOff = xOff;
            }
            if(yOff !== undefined) {
                this.yOff = yOff;
            }
        },
        setDimensions: function (width, height) {
            this.width = width;
            this.height = height;
        },
        toXML: function (xmlDoc, content) {
            var root = util.createElement(xmlDoc, 'xdr:oneCellAnchor');
            var from = util.createElement(xmlDoc, 'xdr:from');
            var fromCol = util.createElement(xmlDoc, 'xdr:col');
            fromCol.appendChild(xmlDoc.createTextNode(this.x));
            var fromColOff = util.createElement(xmlDoc, 'xdr:colOff');
            fromColOff.appendChild(xmlDoc.createTextNode(this.xOff || 0));
            var fromRow = util.createElement(xmlDoc, 'xdr:row');
            fromRow.appendChild(xmlDoc.createTextNode(this.y));
            var fromRowOff = util.createElement(xmlDoc, 'xdr:rowOff');
            fromRowOff.appendChild(xmlDoc.createTextNode(this.yOff || 0));
            from.appendChild(fromCol);
            from.appendChild(fromColOff);
            from.appendChild(fromRow);
            from.appendChild(fromRowOff);
            
            root.appendChild(from);
            
            var dimensions = util.createElement(xmlDoc, 'xdr:ext');
            dimensions.setAttribute('cx', this.width);
            dimensions.setAttribute('cy', this.height);
            root.appendChild(dimensions);
            
            root.appendChild(content);
            
            root.appendChild(util.createElement(xmlDoc, 'xdr:clientData'));
            return root;
        }
    });
    return OneCellAnchor;
});
define('Excel/Drawings/TwoCellAnchor.js',['underscore', '../util'], function (_, util) {
    TwoCellAnchor = function (config) {
        this.from = {xOff: 0, yOff: 0};
        this.to = {xOff: 0, yOff: 0};
        if(config) {
            this.setFrom(config.from.x, config.from.y, config.to.xOff, config.to.yOff);
            this.setTo(config.to.x, config.to.y, config.to.xOff, config.to.yOff);
        }
    };
    _.extend(TwoCellAnchor.prototype, {
        setFrom: function (x, y, xOff, yOff) {
            this.from.x = x; 
            this.from.y = y;
            if(xOff !== undefined) {
                this.from.xOff = xOff;
            }
            if(yOff !== undefined) {
                this.from.yOff = xOff;
            }
        },
        setTo: function (x, y, xOff, yOff) {
            this.to.x = x; 
            this.to.y = y;
            if(xOff !== undefined) {
                this.to.xOff = xOff;
            }
            if(yOff !== undefined) {
                this.to.yOff = xOff;
            }
        },
        toXML: function (xmlDoc, content) {
            var root = util.createElement(xmlDoc, 'xdr:twoCellAnchor');
            
            var from = util.createElement(xmlDoc, 'xdr:from');
            var fromCol = util.createElement(xmlDoc, 'xdr:col');
            fromCol.appendChild(xmlDoc.createTextNode(this.from.x));
            var fromColOff = util.createElement(xmlDoc, 'xdr:colOff');
            fromColOff.appendChild(xmlDoc.createTextNode(this.from.xOff));
            var fromRow = util.createElement(xmlDoc, 'xdr:row');
            fromRow.appendChild(xmlDoc.createTextNode(this.from.y));
            var fromRowOff = util.createElement(xmlDoc, 'xdr:rowOff');
            fromRowOff.appendChild(xmlDoc.createTextNode(this.from.yOff));
            
            from.appendChild(fromCol);
            from.appendChild(fromColOff);
            from.appendChild(fromRow);
            from.appendChild(fromRowOff);
            
            var to = util.createElement(xmlDoc, 'xdr:to');
            var toCol = util.createElement(xmlDoc, 'xdr:col');
            toCol.appendChild(xmlDoc.createTextNode(this.to.x));
            var toColOff = util.createElement(xmlDoc, 'xdr:colOff');
            toColOff.appendChild(xmlDoc.createTextNode(this.from.xOff));
            var toRow = util.createElement(xmlDoc, 'xdr:row');
            toRow.appendChild(xmlDoc.createTextNode(this.to.y));
            var toRowOff = util.createElement(xmlDoc, 'xdr:rowOff');
            toRowOff.appendChild(xmlDoc.createTextNode(this.from.yOff));
            
            to.appendChild(toCol);
            to.appendChild(toColOff);
            to.appendChild(toRow);
            to.appendChild(toRowOff);
            
            
            root.appendChild(from);
            root.appendChild(to);
            
            root.appendChild(content);
            
            root.appendChild(util.createElement(xmlDoc, 'xdr:clientData'));
            return root;
        }
    });
    return TwoCellAnchor;
});

/**
 * This is mostly a global spot where all of the relationship managers can get and set
 * path information from/to. 
 * @module Excel/Drawing
 */
define('Excel/Drawings/Drawing',[
    'underscore', './AbsoluteAnchor', './OneCellAnchor', './TwoCellAnchor'
], function (_, AbsoluteAnchor, OneCellAnchor, TwoCellAnchor) {
    /**
     * @constructor
     */
    var Drawing = function () {
        this.id = _.uniqueId('Drawing');
    };
    
    _.extend(Drawing.prototype, {
        /**
         * 
         * @param {String} type Can be 'absoluteAnchor', 'oneCellAnchor', or 'twoCellAnchor'. 
         * @param {Object} config Shorthand - pass the created anchor coords that can normally be used to construct it.
         * @returns {Anchor}
         */
        createAnchor: function (type, config) {
            config = config || {};
            config.drawing = this;
            switch(type) {
                case 'absoluteAnchor': 
                    this.anchor = new AbsoluteAnchor(config);
                    break;
                case 'oneCellAnchor':
                    this.anchor = new OneCellAnchor(config);
                    break;
                case 'twoCellAnchor':
                    this.anchor = new TwoCellAnchor(config);
                    break;
            }
            return this.anchor;
        }
    });
    
    return Drawing;
});
define('Excel/Drawings/Picture.js',['./Drawing', 'underscore', '../util'], function (Drawing, _, util) {
    Picture = function () {
        this.media = null;
        this.id = _.uniqueId('Picture');
        this.pictureId = util.uniqueId('Picture');
        this.fill = {};
        this.mediaData = null;
    };
    //
    Picture.prototype = new Drawing();
    
    _.extend(Picture.prototype, {
        setMedia: function (mediaRef) {
            this.mediaData = mediaRef;
        },
        setDescription: function (description) {
            this.description = description;
        },
        setFillType: function (type) {
            this.fill.type = type;
        },
        setFillConfig: function (config) {
            _.extend(this.fill, config);
        },
        getMediaType: function () {
            return 'image';
        },
        getMediaData: function () {
            return this.mediaData;
        },
        setRelationshipId: function (rId) {
            this.mediaData.rId = rId;
        },
        toXML: function (xmlDoc) {
            var pictureNode = util.createElement(xmlDoc, 'xdr:pic');
            
            var nonVisibleProperties = util.createElement(xmlDoc, 'xdr:nvPicPr');
            
            var nameProperties = util.createElement(xmlDoc, 'xdr:cNvPr', [
                ['id', this.pictureId],
                ['name', this.mediaData.fileName],
                ['descr', this.description || ""]
            ]);
            nonVisibleProperties.appendChild(nameProperties);
            var nvPicProperties = util.createElement(xmlDoc, 'xdr:cNvPicPr');
            nvPicProperties.appendChild(util.createElement(xmlDoc, 'a:picLocks', [
                ['noChangeAspect', '1'],
                ['noChangeArrowheads', '1']
            ]));
            nonVisibleProperties.appendChild(nvPicProperties);
            pictureNode.appendChild(nonVisibleProperties);
            var pictureFill = util.createElement(xmlDoc, 'xdr:blipFill');
            pictureFill.appendChild(util.createElement(xmlDoc, 'a:blip', [
                ['xmlns:r', util.schemas.relationships],
                ['r:embed', this.mediaData.rId]
            ]));
            pictureFill.appendChild(util.createElement(xmlDoc, 'a:srcRect'));
            var stretch = util.createElement(xmlDoc, 'a:stretch');
            stretch.appendChild(util.createElement(xmlDoc, 'a:fillRect'));
            pictureFill.appendChild(stretch);
            pictureNode.appendChild(pictureFill);
            
            var shapeProperties = util.createElement(xmlDoc, 'xdr:spPr', [
                ['bwMode', 'auto']
            ]);
            
            var transform2d = util.createElement(xmlDoc, 'a:xfrm');
            shapeProperties.appendChild(transform2d);
            
            var presetGeometry = util.createElement(xmlDoc, 'a:prstGeom', [
                ['prst', 'rect']
            ]);
            shapeProperties.appendChild(presetGeometry);
            
            
            
            pictureNode.appendChild(shapeProperties);
//            <xdr:spPr bwMode="auto">
//                <a:xfrm>
//                    <a:off x="1" y="1"/>
//                    <a:ext cx="1640253" cy="1885949"/>
//                </a:xfrm>
//                <a:prstGeom prst="rect">
//                    <a:avLst/>
//                </a:prstGeom>
//                <a:noFill/>
//                <a:extLst>
//                    <a:ext uri="{909E8E84-426E-40DD-AFC4-6F175D3DCCD1}">
//                        <a14:hiddenFill xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main">
//                            <a:solidFill>
//                                <a:srgbClr val="FFFFFF"/>
//                            </a:solidFill>
//                        </a14:hiddenFill>
//                    </a:ext>
//                </a:extLst>
//            </xdr:spPr>
//            
            return this.anchor.toXML(xmlDoc, pictureNode);
        }
    });
    return Picture;
});
define('Excel/Positioning.js',[], function () {
    return {
        /**
         * Converts pixel sizes to 'EMU's, which is what Open XML uses. 
         * 
         * @todo clean this up. Code borrowed from http://polymathprogrammer.com/2009/10/22/english-metric-units-and-open-xml/,
         * but not sure that it's going to be as accurate as it needs to be.
         * 
         * @param int pixels
         * @returns int
         */
        pixelsToEMUs: function (pixels) {
            return Math.round(pixels * 914400 / 96);
        }
    };
});

/**
 * @module Excel/SharedStrings
 */
define('Excel/SharedStrings',['underscore', './util'], function (_, util) {
    var sharedStrings = function () {
        this.strings = {};
        this.stringArray = [];
        this.id = _.uniqueId('SharedStrings');
    }
    _.extend(sharedStrings.prototype, {
        /**
         * Adds a string to the shared string file, and returns the ID of the 
         * string which can be used to reference it in worksheets.
         * 
         * @param string {String}
         * @return int
         */
        addString: function (string) {
            this.strings[string] = this.stringArray.length;
            this.stringArray[this.stringArray.length] = string;
            return this.strings[string];
        },
        
        exportData: function () {
            return this.strings;
        },
        
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'sst');
            var sharedStringTable = doc.documentElement;
            this.stringArray.reverse();
            var l = this.stringArray.length;
            sharedStringTable.setAttribute('count', l);
            sharedStringTable.setAttribute('uniqueCount', l);
            
            var template = doc.createElement('si');
            var templateValue = doc.createElement('t');
            templateValue.appendChild(doc.createTextNode('--placeholder--'));
            template.appendChild(templateValue);
            var strings = this.stringArray;
            
            while (l--) {
                var clone = template.cloneNode(true);
                clone.firstChild.firstChild.nodeValue = strings[l];
                sharedStringTable.appendChild(clone);
            }
            
            return doc;
        }
    });
    return sharedStrings;
});

/**
 * @module Excel/StyleSheet
 */
define('Excel/StyleSheet',['underscore', './util'], function (_, util) {
    var StyleSheet = function (config) {
        this.id = _.uniqueId('StyleSheet');
        this.cellStyles = [{
            name:"Normal", 
            xfId:"0", 
            builtinId:"0"
        }];
        this.defaultTableStyle = false;
        this.differentialStyles = [{}];
        this.masterCellFormats = [{
            numFmtId: 0, 
            fontId: 0, 
            fillId: 0, 
            borderId: 0, 
            xfid: 0
        }];
        this.masterCellStyles = [{
            numFmtId: 0, 
            fontId: 0, 
            fillId: 0, 
            borderId: 0
        }];
        this.fonts = [{}];
        this.numberFormatters = [];
        this.fills = [{}, {
            type: 'pattern', 
            patternType: 'gray125', 
            fgColor: 'FF333333', 
            bgColor: 'FF333333'
        }];
        this.borders = [{
            top: {},
            left: {},
            right: {},
            bottom: {},
            diagonal: {}
        }];
        this.tableStyles = [];
    };
    _.extend(StyleSheet.prototype, {
        createSimpleFormatter: function (type) {
            var sid = this.masterCellFormats.length;
            var style = {
                id: sid
            };
            switch(type) {
                case 'date':
                    style.numFmtId = 14;
                    break;
            }
            this.masterCellFormats.push(style);
            return style;
        },

        createFill: function (fillInstructions) {
            var id = this.fills.length;
            var fill = fillInstructions;
            fill.id = id;
            this.fills.push(fill);
            return fill;
        },

        createNumberFormatter: function (formatInstructions) {
            var id = this.numberFormatters.length + 100;
            var format = {
                id: id,
                formatCode: formatInstructions
            }
            this.numberFormatters.push(format);
            return format;
        },

        /**
        * alignment: {
        *  horizontal: http://www.schemacentral.com/sc/ooxml/t-ssml_ST_HorizontalAlignment.html
        *  vertical: http://www.schemacentral.com/sc/ooxml/t-ssml_ST_VerticalAlignment.html
        */
        createFormat: function (styleInstructions) {
            var sid = this.masterCellFormats.length;
            var style = {
                id: sid
            };
            if(styleInstructions.font && _.isObject(styleInstructions.font)) {
                style.fontId = this.createFontStyle(styleInstructions.font).id;
            } else if(styleInstructions.font) {
                if(_.isNaN(parseInt(styleInstructions.font, 10))) {
                    throw "Passing a non-numeric font id is not supported";
                }
                style.fontId = styleInstructions.font;
            }

            if (styleInstructions.format && _.isString(styleInstructions.format)) {
                style.numFmtId = this.createNumberFormatter(styleInstructions.format).id;
            } else if(styleInstructions.format) {
                if(_.isNaN(parseInt(styleInstructions.format))) {
                    throw "Invalid number formatter id";
                }
                style.numFmtId = styleInstructions.format;
            }

            if (styleInstructions.border && _.isObject(styleInstructions.border)) {
                style.borderId = this.createBorderFormatter(styleInstructions.border).id;
            } else if (styleInstructions.border) {
                if(_.isNaN(parseInt(styleInstructions.border))) {
                    throw "Passing a non-numeric border id is not supported";
                }
                style.borderId = styleInstructions.border;
            }

            if (styleInstructions.fill && _.isObject(styleInstructions.fill)) {
                style.fillId = this.createFill(styleInstructions.fill).id;
            } else if (styleInstructions.fill) {
                if(_.isNaN(parseInt(styleInstructions.fill))) {
                    throw "Passing a non-numeric fill id is not supported";
                }
                style.fillId = styleInstructions.fill;
            }

            if (styleInstructions.alignment && _.isObject(styleInstructions.alignment)) {
                style.alignment = _.pick(
                    styleInstructions.alignment,
                    'horizontal',
                    'justifyLastLine',
                    'readingOrder',
                    'relativeIndent',
                    'shrinkToFit',
                    'textRotation',
                    'vertical',
                    'wrapText'
                    );
            }

            this.masterCellFormats.push(style);
            return style;
        },
        
        createDifferentialStyle: function (styleInstructions) {
            var id = this.differentialStyles.length;
            var style = {
                id: id
            }
            if(styleInstructions.font && _.isObject(styleInstructions.font)) {
                style.font = styleInstructions.font;
            }
            if (styleInstructions.border && _.isObject(styleInstructions.border)) {
                style.border = _.defaults(styleInstructions.border, {
                    top: {},
                    left: {},
                    right: {},
                    bottom: {},
                    diagonal: {}
		});
            }
            if (styleInstructions.fill && _.isObject(styleInstructions.fill)) {
                style.fill = styleInstructions.fill;
            }
            if (styleInstructions.alignment && _.isObject(styleInstructions.alignment)) {
                style.alignment = styleInstructions.alignment;
            }
            if (styleInstructions.format && _.isString(styleInstructions.format)) {
                style.numFmt = styleInstructions.format;
            }
            this.differentialStyles[id] = style;
            return style;
        },
        
        /**
         * Should be an object containing keys that match with one of the keys from this list:
         * http://www.schemacentral.com/sc/ooxml/t-ssml_ST_TableStyleType.html
         * 
         * The value should be a reference to a differential format (dxf)
         */
        createTableStyle: function (instructions) {
            this.tableStyles.push(instructions);
        },
        
        /**
        * All params optional
        * Expects: {
        * top: {},
        * left: {},
        * right: {},
        * bottom: {},
        * diagonal: {},
        * outline: boolean,
        * diagonalUp: boolean,
        * diagonalDown: boolean
        * }
        * Each border should follow:
        * {
        * style: styleString, http://www.schemacentral.com/sc/ooxml/t-ssml_ST_BorderStyle.html
        * color: ARBG color (requires the A, so for example FF006666)
        * }
        */
        createBorderFormatter: function (border) {
            _.defaults(border, {
                top: {},
                left: {},
                right: {},
                bottom: {},
                diagonal: {},
                id: this.borders.length
            });
            this.borders.push(border);
            return border;
        },

        /**
        * Supported font styles:
        * bold
        * italic
        * underline (single, double, singleAccounting, doubleAccounting)
        * size
        * color
        * fontName
        * strike (strikethrough)
        * outline (does this actually do anything?)
        * shadow (does this actually do anything?)
        * superscript
        * subscript
        *
        * Color is a future goal - at the moment it's looking a bit complicated
        */
        createFontStyle: function (instructions) {
            var fontId = this.fonts.length;
            var fontStyle = {
                id: fontId
            };
            if(instructions.bold) {
                fontStyle.bold = true;
            }
            if(instructions.italic) {
                fontStyle.italic = true;
            }
            if(instructions.superscript) {
                fontStyle.vertAlign = 'superscript';
            }
            if(instructions.subscript) {
                fontStyle.vertAlign = 'subscript';
            }
            if(instructions.underline) {
                if(_.indexOf([
                    'double',
                    'singleAccounting',
                    'doubleAccounting'
                    ], instructions.underline) != -1) {
                    fontStyle.underline = instructions.underline;
                } else {
                    fontStyle.underline = true;
                }
            }
            if(instructions.strike) {
                fontStyle.strike = true;
            }
            if(instructions.outline) {
                fontStyle.outline = true;
            }
            if(instructions.shadow) {
                fontStyle.shadow = true;
            }
            if(instructions.size) {
                fontStyle.size = instructions.size;
            }
            if(instructions.color) {
                fontStyle.color = instructions.color;
            }
            if(instructions.fontName) {
                fontStyle.fontName = instructions.fontName;
            }
            this.fonts.push(fontStyle);
            return fontStyle;
        },

        exportBorders: function (doc) {
            var borders = doc.createElement('borders');
            borders.setAttribute('count', this.borders.length);
            
            for(var i = 0, l = this.borders.length; i < l; i++) {
                borders.appendChild(this.exportBorder(doc, this.borders[i]));
            }
            return borders;
        },

        exportBorder: function (doc, data) {
            var border = doc.createElement('border');
            var self = this;
            var borderGenerator = function (name) {
                var b = doc.createElement(name);
                if(data[name].style) {
                    b.setAttribute('style', data[name].style);
                }
                if(data[name].color) {
                    b.appendChild(self.exportColor(doc, data[name].color));
                }
                return b;
            };
            border.appendChild(borderGenerator('left'));
            border.appendChild(borderGenerator('right'));
            border.appendChild(borderGenerator('top'));
            border.appendChild(borderGenerator('bottom'));
            border.appendChild(borderGenerator('diagonal'));
            return border;
        },

        exportColor: function (doc, color) {
            var colorEl = doc.createElement('color');
            if(_.isString(color)) {
                colorEl.setAttribute('rgb', color);
                return colorEl;
            }

            if (!_.isUndefined(color.tint)) { 
                colorEl.setAttribute('tint', color.tint);
            }
            if (!_.isUndefined(color.auto)) { 
                colorEl.setAttribute('auto', !!color.auto);
            }
            if (!_.isUndefined(color.theme)) { 
                colorEl.setAttribute('theme', color.theme);
            }

            return colorEl;
        },

        exportMasterCellFormats: function (doc) {
            var cellFormats = util.createElement(doc, 'cellXfs', [
                ['count', this.masterCellFormats.length]
                ]);
            for(var i = 0, l = this.masterCellFormats.length; i < l; i++) {
                var mformat = this.masterCellFormats[i];
                cellFormats.appendChild(this.exportCellFormatElement(doc, mformat));
            }
            return cellFormats;
        },

        exportMasterCellStyles: function (doc) {
            var records = util.createElement(doc, 'cellStyleXfs', [
                ['count', this.masterCellStyles.length]
                ]);
            for(var i = 0, l = this.masterCellStyles.length; i < l; i++) {
                var mstyle = this.masterCellStyles[i];
                records.appendChild(this.exportCellFormatElement(doc, mstyle));
            }
            return records;
        },

        exportCellFormatElement: function (doc, styleInstructions) {
            var xf = doc.createElement('xf'), i = 0, l;
            var allowed = ['applyAlignment', 'applyBorder', 'applyFill', 'applyFont', 'applyNumberFormat', 
            'applyProtection', 'borderId', 'fillId', 'fontId', 'numFmtId', 'pivotButton', 'quotePrefix', 'xfId']
            var attributes = _.filter(_.keys(styleInstructions), function (key) {
                if(_.indexOf(allowed, key) != -1) {
                    return true;
                }
            });
            if(styleInstructions.alignment) {
                var alignmentData = styleInstructions.alignment;
                xf.appendChild(this.exportAlignment(doc, alignmentData));
            }
            var a = attributes.length;
            while(a--) {
                xf.setAttribute(attributes[a], styleInstructions[attributes[a]]);
            }
            if(styleInstructions.fillId) {
                xf.setAttribute('applyFill', '1');
            }
            return xf;
        },
        
        exportAlignment: function (doc, alignmentData) {
            var alignment = doc.createElement('alignment');
            var keys = _.keys(alignmentData);
            for(var i = 0, l = keys.length; i < l; i++) {
                alignment.setAttribute(keys[i], alignmentData[keys[i]]);
            }
            return alignment;
        },
        
        exportFonts: function (doc) {
            var fonts = doc.createElement('fonts');
            fonts.setAttribute('count', this.fonts.length);
            for(var i = 0, l = this.fonts.length; i < l; i++) {
                var fd = this.fonts[i];
                fonts.appendChild(this.exportFont(doc, fd));
            }
            return fonts;
        },
        
        exportFont: function (doc, fd) {
            var font = doc.createElement('font');
            if(fd.size) {
                var size = doc.createElement('sz');
                size.setAttribute('val', fd.size);
                font.appendChild(size);
            }

            if(fd.fontName) {
                var fontName = doc.createElement('name');
                fontName.setAttribute('val', fd.name);
                font.appendChild(fontName);
            }

            if(fd.bold) {
                font.appendChild(doc.createElement('b'));
            }
            if(fd.italic) {
                font.appendChild(doc.createElement('i'));
            }
            if(fd.vertAlign) {
                var vertAlign = doc.createElement('vertAlign');
                vertAlign.setAttribute('val', fd.vertAlign);
                font.appendChild(vertAlign);
            }
            if(fd.underline) { 
                var u = doc.createElement('u');
                if(fd.underline !== true) {
                    u.setAttribute('val', fd.underline);
                }
                font.appendChild(u); 
            }
            if(fd.strike) {
                font.appendChild(doc.createElement('strike'));
            }
            if(fd.shadow) {
                font.appendChild(doc.createElement('shadow'));
            }
            if(fd.outline) {
                font.appendChild(doc.createElement('outline'));
            }
            if(fd.color) {
                font.appendChild(this.exportColor(doc, fd.color));
            }
            return font;
        },

        exportFills: function (doc) {
            var fills = doc.createElement('fills');
            fills.setAttribute('count', this.fills.length);
            for(var i = 0, l = this.fills.length; i < l; i++) {
                var fd = this.fills[i];
                fills.appendChild(this.exportFill(doc, fd));
            }
            return fills;
        },
        
        exportFill: function (doc, fd) {
            var fillDef;
            var fill = doc.createElement('fill');
            if (fd.type == 'pattern') {
                fillDef = this.exportPatternFill(doc, fd);
                fill.appendChild(fillDef);
            } else if (fd.type == 'gradient') {
                fillDef = this.exportGradientFill(doc, fd);
                fill.appendChild(fillDef);
            }
            return fill;
        },
        
        exportGradientFill: function (doc, data) {
            var fillDef = doc.createElement('gradientFill');
            if(data.degree) {
                fillDef.setAttribute('degree', data.degree);
            } else if (data.left) {
                fillDef.setAttribute('left', data.left);
                fillDef.setAttribute('right', data.right);
                fillDef.setAttribute('top', data.top);
                fillDef.setAttribute('bottom', data.bottom);
            }
            var start = doc.createElement('stop');
            start.setAttribute('position', data.start.pureAt || 0);
            var startColor = doc.createElement('color');
            if (typeof data.start == 'string' || data.start.color) {
                startColor.setAttribute('rgb', data.start.color || data.start);
            } else if (typeof data.start.theme) {
                startColor.setAttribute('theme', data.start.theme);
            }
            
            var end = doc.createElement('stop');
            var endColor = doc.createElement('color');
            end.setAttribute('position', data.end.pureAt || 1);
            if (typeof data.start == 'string' || data.end.color) {
                endColor.setAttribute('rgb', data.end.color || data.end);
            } else if (typeof data.end.theme) {
                endColor.setAttribute('theme', data.end.theme);
            }
            start.appendChild(startColor);
            end.appendChild(endColor);
            fillDef.appendChild(start);
            fillDef.appendChild(end);
            return fillDef;
        },
        
        /**
        * Pattern types: http://www.schemacentral.com/sc/ooxml/t-ssml_ST_PatternType.html
        */
        exportPatternFill: function (doc, data) {
            var fillDef = util.createElement(doc, 'patternFill', [
                ['patternType', data.patternType]
                ]);
            if(!data.bgColor) {
                data.bgColor = 'FFFFFFFF';
            }
            if(!data.fgColor) {
                data.fgColor = 'FFFFFFFF';
            }

            var bgColor = doc.createElement('bgColor');
            if(_.isString(data.bgColor)) {
                bgColor.setAttribute('rgb', data.bgColor)
            } else {
                if(data.bgColor.theme) {
                    bgColor.setAttribute('theme', data.bgColor.theme);
                } else {
                    bgColor.setAttribute('rgb', data.bgColor.rbg);
                }
            }

            var fgColor = doc.createElement('fgColor');
            if(_.isString(data.fgColor)) {
                fgColor.setAttribute('rgb', data.fgColor)
            } else {
                if(data.fgColor.theme) {
                    fgColor.setAttribute('theme', data.fgColor.theme);
                } else {
                    fgColor.setAttribute('rgb', data.fgColor.rbg);
                }
            }
            fillDef.appendChild(fgColor);
            fillDef.appendChild(bgColor);
            return fillDef;
        },

        exportNumberFormatters: function (doc) {
            var formatters = doc.createElement('numFmts');
            formatters.setAttribute('count', this.numberFormatters.length);
            for(var i = 0, l = this.numberFormatters.length; i < l; i++) {
                var fd = this.numberFormatters[i];
                formatters.appendChild(this.exportNumberFormatter(doc, fd));
            }
            return formatters;
        },
        
        exportNumberFormatter: function (doc, fd) {
            var numFmt = doc.createElement('numFmt');
            numFmt.setAttribute('numFmtId', fd.id);
            numFmt.setAttribute('formatCode', fd.formatCode);
            return numFmt;
        },

        exportCellStyles: function (doc) {
            var cellStyles = doc.createElement('cellStyles');
            cellStyles.setAttribute('count', this.cellStyles.length);

            for(var i = 0, l = this.cellStyles.length; i < l; i++) {
                var style = this.cellStyles[i];
                delete style.id; //Remove internal id
                var record = util.createElement(doc, 'cellStyle');
                cellStyles.appendChild(record);
                var attributes = _.keys(style);
                var a = attributes.length;
                while(a--) {
                    record.setAttribute(attributes[a], style[attributes[a]]);
                }
            }

            return cellStyles;
        },

        exportDifferentialStyles: function (doc) {
            var dxfs = doc.createElement('dxfs');
            dxfs.setAttribute('count', this.differentialStyles.length);

            for(var i = 0, l = this.differentialStyles.length; i < l; i++) {
                var style = this.differentialStyles[i];
                dxfs.appendChild(this.exportDFX(doc, style));
            }

            return dxfs;
        },
        
        exportDFX: function (doc, style) {
            var dxf = doc.createElement('dxf');
            if(style.font) {
                dxf.appendChild(this.exportFont(doc, style.font));
            }
            if(style.fill) {
                dxf.appendChild(this.exportFill(doc, style.fill));
            }
	    if(style.border) {
                dxf.appendChild(this.exportBorder(doc, style.border));
            }
            if(style.numFmt) {
                dxf.appendChild(this.exportNumberFormatter(doc, style.numFmt));
            }
            if(style.alignment) {
                dxf.appendChild(this.exportAlignment(doc, style.alignment));
            }
            return dxf;
        },
        
        exportTableStyles: function (doc) {
            var tableStyles = doc.createElement('tableStyles');
            tableStyles.setAttribute('count', this.tableStyles.length);
            if(this.defaultTableStyle) {
                tableStyles.setAttribute('defaultTableStyle', this.defaultTableStyle);
            }
            for(var i = 0, l = this.tableStyles.length; i < l; i++) {
                tableStyles.appendChild(this.exportTableStyle(doc, this.tableStyles[i]));
            }
            return tableStyles;
        },
        
        exportTableStyle: function (doc, style) {
            var tableStyle = doc.createElement('tableStyle');
            tableStyle.setAttribute('name', style.name);
            tableStyle.setAttribute('pivot', 0);
            var i = 0;
            
            _.each(style, function (value, key) {
                if(key == 'name') {return;}
                i++;
                var styleEl = doc.createElement('tableStyleElement');
                styleEl.setAttribute('type', key);
                styleEl.setAttribute('dxfId', value);
                tableStyle.appendChild(styleEl);
            });
            tableStyle.setAttribute('count', i);
            return tableStyle;
        },
        
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'styleSheet');
            var styleSheet = doc.documentElement;
            styleSheet.appendChild(this.exportNumberFormatters(doc));
            styleSheet.appendChild(this.exportFonts(doc));
            styleSheet.appendChild(this.exportFills(doc));
            styleSheet.appendChild(this.exportBorders(doc));
            styleSheet.appendChild(this.exportMasterCellStyles(doc));
            styleSheet.appendChild(this.exportMasterCellFormats(doc));
            styleSheet.appendChild(this.exportCellStyles(doc));
            styleSheet.appendChild(this.exportDifferentialStyles(doc));
            if(this.tableStyles.length) {
                styleSheet.appendChild(this.exportTableStyles(doc));
            }
            return doc;
        }
    });
    return StyleSheet;
});


/**
 * @module Excel/Table
 */
define('Excel/Table.js',['underscore', './util'], function (_, util) {
    var Table = function (config) {
        _.defaults(this, {
            name: "",
            displayName: "",
            dataCellStyle: null,
            dataDfxId: null,
            headerRowBorderDxfId: null,
            headerRowCellStyle: null,
            headerRowCount: 1,
            headerRowDxfId: null,
            insertRow: false,
            insertRowShift: false,
            ref: null,
            tableBorderDxfId: null,
            totalsRowBorderDxfId: null,
            totalsRowCellStyle: null,
            totalsRowCount: 0,
            totalsRowDxfId: null,
            tableColumns: [],
            autoFilter: null,
            sortState: null,
            styleInfo: {}
        });
        this.initialize(config);
    };
    _.extend(Table.prototype, {
		
        initialize: function (config) {
            this.displayName = _.uniqueId("Table");
            this.name = this.displayName;
            this.id = this.name;
            this.tableId = this.id.replace('Table', '');
            _.extend(this, config);
        },
		
        setReferenceRange: function (start, end) {
            this.ref = [start, end];
        },
		
        setTableColumns: function (columns) {
            _.each(columns, function (column) {
                this.addTableColumn(column);
            }, this);
        },
		
        /**
        * Expects an object with the following optional properties:
        * name (required)
        * dataCellStyle 
        * dataDxfId
        * headerRowCellStyle
        * headerRowDxfId
        * totalsRowCellStyle
        * totalsRowDxfId
        * totalsRowFunction
        * totalsRowLabel
        * columnFormula
        * columnFormulaIsArrayType (boolean)
        * totalFormula
        * totalFormulaIsArrayType (boolean)
        */
        addTableColumn: function (column) {
            if(_.isString(column)) {
                column = {
                    name: column
                };            
            }
            if(!column.name) {
                throw "Invalid argument for addTableColumn - minimum requirement is a name property";
            }
            this.tableColumns.push(column);
        },
		
        /**
        * Expects an object with the following properties:
        * caseSensitive (boolean)
        * dataRange
        * columnSort (assumes true)
        * sortDirection
        * sortRange (defaults to dataRange)
        */
        setSortState: function (state) {
            this.sortState = state;
        },
		
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'table');
            var table = doc.documentElement;
            table.setAttribute('id', this.tableId);
            table.setAttribute('name', this.name);
            table.setAttribute('displayName', this.displayName);
            var s = this.ref[0];
            var e = this.ref[1];
            table.setAttribute('ref', util.positionToLetterRef(s[0], s[1]) + ":" + util.positionToLetterRef(e[0], e[1]));
            
            /** TOTALS **/
            table.setAttribute('totalsRowCount', this.totalsRowCount);
            
            /** HEADER **/
            table.setAttribute('headerRowCount', this.headerRowCount);
            if(this.headerRowDxfId) {
                table.setAttribute('headerRowDxfId', this.headerRowDxfId);
            }
            if(this.headerRowBorderDxfId) {
                table.setAttribute('headerRowBorderDxfId', this.headerRowBorderDxfId);
            }
			
            if(!this.ref) {
                throw "Needs at least a reference range";
            }
            if(!this.autoFilter) {
                this.addAutoFilter(this.ref[0], this.ref[1]);
            }
			
            table.appendChild(this.exportAutoFilter(doc));
			
            table.appendChild(this.exportTableColumns(doc));
            table.appendChild(this.exportTableStyleInfo(doc));
            return table;
        },
		
        exportTableColumns: function (doc) {
            var tableColumns = doc.createElement('tableColumns');
            tableColumns.setAttribute('count', this.tableColumns.length);
            var tcs = this.tableColumns;
            for(var i = 0, l = tcs.length; i < l; i++) {
                var tc = tcs[i];
                var tableColumn = doc.createElement('tableColumn');
                tableColumn.setAttribute('id', i + 1);
                tableColumn.setAttribute('name', tc.name);
                tableColumns.appendChild(tableColumn);
                
                if(tc.totalsRowFunction) {
                    tableColumn.setAttribute('totalsRowFunction', tc.totalsRowFunction);
                }
                if(tc.totalsRowLabel) {
                    tableColumn.setAttribute('totalsRowLabel', tc.totalsRowLabel);
                }
            }
            return tableColumns;
        },
		
        exportAutoFilter: function (doc) {
            var autoFilter = doc.createElement('autoFilter');
            var s = this.autoFilter[0];
            var e = this.autoFilter[1]
            autoFilter.setAttribute('ref', util.positionToLetterRef(s[0], s[1]) + ":" + util.positionToLetterRef(e[0], e[1]  - this.totalsRowCount));
            return autoFilter;
        },
		
        exportTableStyleInfo: function (doc) {
            var ts = this.styleInfo;
            var tableStyle = doc.createElement('tableStyleInfo');
            tableStyle.setAttribute('name', ts.themeStyle);
            tableStyle.setAttribute('showFirstColumn', ts.showFirstColumn ? "1" : "0");
            tableStyle.setAttribute('showLastColumn', ts.showLastColumn ? "1" : "0");
            tableStyle.setAttribute('showColumnStripes', ts.showColumnStripes ? "1" : "0");
            tableStyle.setAttribute('showRowStripes', ts.showRowStripes ? "1" : "0");
            return tableStyle;
        },
		
        addAutoFilter: function (startRef, endRef) {
            this.autoFilter = [startRef, endRef];
        }
    });
    return Table;
});


/**
 * This module represents an excel worksheet in its basic form - no tables, charts, etc. Its purpose is 
 * to hold data, the data's link to how it should be styled, and any links to other outside resources.
 * 
 * @module Excel/Worksheet
 */
define('Excel/Worksheet.js',['underscore', './util', './RelationshipManager'], function (_, util, RelationshipManager) {
    /**
     * @constructor
     */
    var Worksheet = function (config) {
        this.relations = null;
        this.columnFormats = [];
        this.data = [];
        this.mergedCells = [];
        this.columns = [];
        this._headers = [];
        this._footers = [];
        this._tables = [];
        this._drawings = [];
        this.initialize(config);
    };
    _.extend(Worksheet.prototype, {
		
        initialize: function (config) {
            config = config || {};
            this.name = config.name;
            this.id = _.uniqueId('Worksheet');
            this._timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
            if(config.columns) {
                this.setColumns(config.columns);
            }
			
            this.relations = new RelationshipManager();
        },
        
        /**
         * Returns an object that can be consumed by a WorksheetExportWorker
         * @returns {Object}
         */
        exportData: function () {
            return {
                relations: this.relations.exportData(),
                columnFormats: this.columnFormats,
                data: this.data,
                columns: this.columns,
                mergedCells: this.mergedCells,
                _headers: this._headers,
                _footers: this._footers,
                _tables: this._tables,
                name: this.name,
                id: this.id
            };
        },
        
        /**
         * Imports data - to be used while inside of a WorksheetExportWorker.
         * @param {Object} data
         */
        importData: function (data) {
            this.relations.importData(data.relations);
            delete data.relations;
            _.extend(this, data);
        },
        
	setSharedStringCollection: function (stringCollection) {
            this.sharedStrings = stringCollection;
        },
        
        addTable: function (table) {
            this._tables.push(table);
            this.relations.addRelation(table, 'table');
        },
                
        addDrawings: function (table) {
            this._drawings.push(table);
            this.relations.addRelation(table, 'drawingRelationship');
        },
		
        /**
        * Expects an array length of three.
        * 
        * @see Excel/Worksheet compilePageDetailPiece 
        * @see <a href='/cookbook/addingHeadersAndFooters.html'>Adding headers and footers to a worksheet</a>
        * 
        * @param {Array} headers [left, center, right]
        */
        setHeader: function (headers) {
            if(!_.isArray(headers)) {
                throw "Invalid argument type - setHeader expects an array of three instructions";
            }
            this._headers = headers;
        },
		
        /**
        * Expects an array length of three.
        * 
        * @see Excel/Worksheet compilePageDetailPiece 
        * @see <a href='/cookbook/addingHeadersAndFooters.html'>Adding headers and footers to a worksheet</a>
        * 
        * @param {Array} footers [left, center, right]
        */
        setFooter: function (footers) {
            if(!_.isArray(footers)) {
                throw "Invalid argument type - setFooter expects an array of three instructions";
            }
            this._footers = footers;
        },
        
        /**
         * Turns page header/footer details into the proper format for Excel.
         * @param {type} data
         * @returns {String}
         */
        compilePageDetailPackage: function (data) {
            data = data || "";
            return [
            "&L", this.compilePageDetailPiece(data[0] || ""),
            "&C", this.compilePageDetailPiece(data[1] || ""),
            "&R", this.compilePageDetailPiece(data[2] || "")
            ].join('');
        },
	
        /**
         * Turns instructions on page header/footer details into something
         * usable by Excel.
         * 
         * @param {type} data
         * @returns {String|@exp;_@call;reduce}
         */
        compilePageDetailPiece: function (data) {
            if(_.isString(data)) {
                return '&"-,Regular"'.concat(data);
            }
            if(_.isObject(data) && !_.isArray(data)) { 
                var string = "";
                if(data.font || data.bold) {
                    var weighting = data.bold ? "Bold" : "Regular";
                    string += '&"' + (data.font || '-');
                    string += ',' + weighting + '"';
                } else {
                    string += '&"-,Regular"';
                }
                if(data.underline) {
                    string += "&U";
                }
                if(data.fontSize) {
                    string += "&"+data.fontSize;
                }
                string += data.text;
				
                return string;
            }
			
            if(_.isArray(data)) {
                var self = this;
                return _.reduce(data, function (m, v) {
                    return m.concat(self.compilePageDetailPiece(v));
                }, "");
            }
        },
        
        /**
         * Creates the header node. 
         * 
         * @todo implement the ability to do even/odd headers
         * @param {XML Doc} doc
         * @returns {XML Node}
         */
        exportHeader: function (doc) {
            var oddHeader = doc.createElement('oddHeader');
            oddHeader.appendChild(doc.createTextNode(this.compilePageDetailPackage(this._headers)));
            return oddHeader;
        },
	
        /**
         * Creates the footer node.
         * 
         * @todo implement the ability to do even/odd footers
         * @param {XML Doc} doc
         * @returns {XML Node}
         */	
        exportFooter: function (doc) {
            var oddFooter = doc.createElement('oddFooter');
            oddFooter.appendChild(doc.createTextNode(this.compilePageDetailPackage(this._footers)));
            return oddFooter;
        },
        
        /**
         * This creates some nodes ahead of time, which cuts down on generation time due to 
         * most cell definitions being essentially the same, but having multiple nodes that need
         * to be created. Cloning takes less time than creation.
         * 
         * @private
         * @param {XML Doc} doc
         * @returns {_L8.Anonym$0._buildCache.Anonym$2}
         */
        _buildCache: function (doc) {
            var numberNode = doc.createElement('c');
            var value = doc.createElement('v');
            value.appendChild(doc.createTextNode("--temp--"));
            numberNode.appendChild(value);
            
            var formulaNode = doc.createElement('c');
            var formulaValue = doc.createElement('f');
            formulaValue.appendChild(doc.createTextNode("--temp--"));
            formulaNode.appendChild(formulaValue);
            
            var stringNode = doc.createElement('c');
            stringNode.setAttribute('t', 's');
            var stringValue = doc.createElement('v');
            stringValue.appendChild(doc.createTextNode("--temp--"));
            stringNode.appendChild(stringValue);
            
            
            return {
                number: numberNode,
                date: numberNode,
                string: stringNode,
                formula: formulaNode
            }
        },
        
        /**
         * Runs through the XML document and grabs all of the strings that will
         * be sent to the 'shared strings' document. 
         * 
         * @returns {Array}
         */
        collectSharedStrings: function () {
            var data = this.data;
            var maxX = 0;
            var strings = {};
            for(var row = 0, l = data.length; row < l; row++) {
                var dataRow = data[row];
                var cellCount = dataRow.length;
                maxX = cellCount > maxX ? cellCount : maxX;
                for(var c = 0; c < cellCount; c++) {
                    var cellValue = dataRow[c];
                    var metadata = cellValue && cellValue.metadata || {};
                    if (cellValue && typeof cellValue == 'object') {
                        cellValue = cellValue.value;
                    }
                    
                    if(!metadata.type) {
                        if(typeof cellValue == 'number') {
                            metadata.type = 'number';
                        }
                    }
                    if(metadata.type == "text" || !metadata.type) {
                        if(typeof strings[cellValue] == 'undefined') {
                            strings[cellValue] = true;
                        }
                    }
                }
            }
            return _.keys(strings);
        },
        
        toXML: function () {
            var data = this.data;
            var columns = this.columns || [];
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'worksheet');
            var worksheet = doc.documentElement;
            worksheet.setAttribute('xmlns:r', util.schemas.relationships);
            worksheet.setAttribute('xmlns:mc', util.schemas.markupCompat);
            
            var maxX = 0;
            var sheetData = util.createElement(doc, 'sheetData');
            
            var cellCache = this._buildCache(doc);
            
            for(var row = 0, l = data.length; row < l; row++) {
                var dataRow = data[row];
                var cellCount = dataRow.length;
                maxX = cellCount > maxX ? cellCount : maxX;
                var rowNode = doc.createElement('row');
                
                for(var c = 0; c < cellCount; c++) {
                    columns[c] = columns[c] || {};
                    var cellValue = dataRow[c];
                    var cell, metadata = cellValue && cellValue.metadata || {};

                    if (cellValue && typeof cellValue == 'object') {
                        cellValue = cellValue.value;
                    }
            
                    if(!metadata.type) {
                        if(typeof cellValue == 'number') {
                            metadata.type = 'number';
                        }
                    }

                    switch(metadata.type) {
                        case "number":
                            cell = cellCache.number.cloneNode(true);
                            cell.firstChild.firstChild.nodeValue = cellValue;
                            break;
                        case "date":
                            cell = cellCache.date.cloneNode(true);
                            cell.firstChild.firstChild.nodeValue = 25569.0 + ((cellValue - this._timezoneOffset)  / (60 * 60 * 24 * 1000));
                            break;
                        case "formula":
                            cell = cellCache.formula.cloneNode(true);
                            cell.firstChild.firstChild.nodeValue = cellValue;
                            break;
                        case "text":
                        default:
                            var id;
                            if(typeof this.sharedStrings.strings[cellValue] != 'undefined') {
                                var id = this.sharedStrings.strings[cellValue];
                            } else {
                                id = this.sharedStrings.addString(cellValue);
                            }
                            cell = cellCache.string.cloneNode(true);
                            cell.firstChild.firstChild.nodeValue = id;
                            break;
                    };
                    if(metadata.style) {
                        cell.setAttribute('s', metadata.style);
                    }
                    cell.setAttribute('r', util.positionToLetterRef(c + 1, row + 1));
                    rowNode.appendChild(cell);
                }
                rowNode.setAttribute('r', row + 1);
                sheetData.appendChild(rowNode);
            } 
            
            if(maxX !== 0) {
                worksheet.appendChild(util.createElement(doc, 'dimension', [
                    ['ref',  util.positionToLetterRef(1, 1) + ':' + util.positionToLetterRef(maxX, data.length)]
                ]));
            } else {
                worksheet.appendChild(util.createElement(doc, 'dimension', [
                    ['ref',  util.positionToLetterRef(1, 1)]
                ]));
            }
            
            if(this.columns.length) {
                worksheet.appendChild(this.exportColumns(doc));
            }
            worksheet.appendChild(sheetData);
			
            this.exportPageSettings(doc, worksheet);
			
            if(this._headers.length > 0 || this._footers.length > 0) {
                var headerFooter = doc.createElement('headerFooter');
                if(this._headers.length > 0) {
                    headerFooter.appendChild(this.exportHeader(doc));
                }
                if(this._footers.length > 0) {
                    headerFooter.appendChild(this.exportFooter(doc));
                }
                worksheet.appendChild(headerFooter);
            }
			
            if(this._tables.length > 0) {
                var tables = doc.createElement('tableParts');
                tables.setAttribute('count', this._tables.length);
                for(var i = 0, l = this._tables.length; i < l; i++) {
                    var table = doc.createElement('tablePart');
                    table.setAttribute('r:id', this.relations.getRelationshipId(this._tables[i]));
                    tables.appendChild(table);
                }
                worksheet.appendChild(tables);
            }
	    
            for(var i = 0, l = this._drawings.length; i < l; i++) {
                var drawing = doc.createElement('drawing');
                drawing.setAttribute('r:id', this.relations.getRelationshipId(this._drawings[i]));
                worksheet.appendChild(drawing);
            }
            
            if (this.mergedCells.length > 0) {
                var mergeCells = doc.createElement('mergeCells');
                for (var i = 0, l = this.mergedCells.length; i < l; i++) {
                    var mergeCell = doc.createElement('mergeCell');
                    mergeCell.setAttribute('ref', this.mergedCells[i][0] + ':' + this.mergedCells[i][1]);
                    mergeCells.appendChild(mergeCell);
                }
                worksheet.appendChild(mergeCells);
            }
            return doc;
        },
        
        /**
         * 
         * @param {XML Doc} doc
         * @returns {XML Node}
         */
        exportColumns: function (doc) {
            var cols = util.createElement(doc, 'cols');
            for(var i = 0, l = this.columns.length; i < l; i++) {
                var cd = this.columns[i];
                var col = util.createElement(doc, 'col', [
                    ['min', cd.min || i + 1],
                    ['max', cd.max || i + 1]
                ]);
                if (cd.hidden) {
                    col.setAttribute('hidden', 1);
                }
                if(cd.bestFit) {
                    col.setAttribute('bestFit', 1);
                }
                if(cd.customWidth || cd.width) {
                    col.setAttribute('customWidth', 1);
                }
                if(cd.width) {
                    col.setAttribute('width', cd.width);
                } else {
                    col.setAttribute('width', 9.140625);
                }
                
                cols.appendChild(col)
            };
            return cols;
        },
        
        /**
         * Sets the page settings on a worksheet node.
         * 
         * @param {XML Doc} doc
         * @param {XML Node} worksheet
         * @returns {undefined}
         */
        exportPageSettings: function (doc, worksheet) {
			
            if(this._orientation) {
                worksheet.appendChild(util.createElement(doc, 'pageSetup', [
                    ['orientation', this._orientation]
                ]));
            }
        },
	
        /**
         * http://www.schemacentral.com/sc/ooxml/t-ssml_ST_Orientation.html
         * 
         * Can be one of 'portrait' or 'landscape'.
         * 
         * @param {String} orientation
         * @returns {undefined}
         */
        setPageOrientation: function (orientation) {
            this._orientation = orientation;
        },
		
        /**
         * Expects an array of column definitions. Each column definition needs to have a width assigned to it. 
         * 
         * @param {Array} Columns
         */
        setColumns: function (columns) {
            this.columns = columns;
        },
        
        /**
         * Expects an array of data to be translated into cells. 
         * 
         * @param {Array} data Two dimensional array - [ [A1, A2], [B1, B2] ]
         * @see <a href='/cookbook/addingDataToAWorksheet.html'>Adding data to a worksheet</a>
         */
        setData: function (data) {
            this.data = data;
        },

        /**
         * Merge cells in given range
         *
         * @param cell1 - A1, A2...
         * @param cell2 - A2, A3...
         */
        mergeCells: function(cell1, cell2) {
            this.mergedCells.push([cell1, cell2]);
        },
        
        /**
         * Expects an array containing an object full of column format definitions.
         * http://msdn.microsoft.com/en-us/library/documentformat.openxml.spreadsheet.column.aspx
         * bestFit
         * collapsed
         * customWidth
         * hidden
         * max
         * min
         * outlineLevel 
         * phonetic
         * style
         * width
         */
        setColumnFormats: function (columnFormats) {
            this.columnFormats = columnFormats;
        }
    });
    return Worksheet;
});


/**
 * @module Excel/Workbook
 */
define('Excel/Workbook.js',[
    'require',
    'underscore', 
    './util', 
    './StyleSheet', 
    './Worksheet',
    './SharedStrings',
    './RelationshipManager',
    './Paths',
    './XMLDOM'
], 
function (require, _, util, StyleSheet, Worksheet, SharedStrings, RelationshipManager, Paths, XMLDOM) {
    var Workbook = function (config) {
        this.worksheets = [];
        this.tables = [];
        this.drawings = [];
        this.media = {};
        this.initialize(config);
    };
    _.extend(Workbook.prototype, {

        initialize: function (config) {
            this.id = _.uniqueId('Workbook');
            this.styleSheet = new StyleSheet();
            this.sharedStrings = new SharedStrings();
            this.relations = new RelationshipManager();
            this.relations.addRelation(this.styleSheet, 'stylesheet');
            this.relations.addRelation(this.sharedStrings, 'sharedStrings');
        },

        createWorksheet: function (config) {
            config = config || {}
            _.defaults(config, {
                name: 'Sheet '.concat(this.worksheets.length + 1)
            })
            return new Worksheet(config);
        },
        
        getStyleSheet: function () {
            return this.styleSheet;
        },

        addTable: function (table) {
            this.tables.push(table);
        },
                
        addDrawings: function (drawings) {
            this.drawings.push(drawings);
        },
        
        addMedia: function (type, fileName, fileData, contentType) {
            var fileNamePieces = fileName.split('.');
            var extension = fileNamePieces[fileNamePieces.length - 1];
            if(!contentType) {
                switch(extension.toLowerCase()) {
                    case 'jpeg':
                    case 'jpg':
                        contentType = "image/jpeg";
                        break;
                    case 'png': 
                        contentType = "image/png";
                        break;
                    case 'gif': 
                        contentType = "image/gif";
                        break;
                    default: 
                        contentType = null;
                        break;
                }
            }
            if(!this.media[fileName]) {
                this.media[fileName] = {
                    id: fileName,
                    data: fileData,
                    fileName: fileName,
                    contentType: contentType,
                    extension: extension
                };
            }
            return this.media[fileName];
        },
        
        addWorksheet: function (worksheet) {
            this.relations.addRelation(worksheet, 'worksheet');
            worksheet.setSharedStringCollection(this.sharedStrings);
            this.worksheets.push(worksheet);
        },

        createContentTypes: function () {
            var doc = util.createXmlDoc(util.schemas.contentTypes, 'Types');
            var types = doc.documentElement;
            
            types.appendChild(util.createElement(doc, 'Default', [
                ['Extension', "rels"],
                ['ContentType', "application/vnd.openxmlformats-package.relationships+xml"]
            ]));
            types.appendChild(util.createElement(doc, 'Default', [
                ['Extension', "xml"],
                ['ContentType', "application/xml"]
            ]));
            
            var extensions = {};
            for(var filename in this.media) {
                extensions[this.media[filename].extension] = this.media[filename].contentType;
            }
            for(var extension in extensions) {
                types.appendChild(util.createElement(doc, 'Default', [
                    ['Extension', extension],
                    ['ContentType', extensions[extension]]
                ]));
            }
            
            types.appendChild(util.createElement(doc, 'Override', [
                ['PartName', "/xl/workbook.xml"],
                ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"]
            ]));
            types.appendChild(util.createElement(doc, 'Override', [
                ['PartName', "/xl/sharedStrings.xml"],
                ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"]
            ]));
            types.appendChild(util.createElement(doc, 'Override', [
                ['PartName', "/xl/styles.xml"],
                ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"]
            ]));

            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                types.appendChild(util.createElement(doc, 'Override', [
                    ['PartName', "/xl/worksheets/sheet" + (i + 1) + ".xml"],
                    ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"]
                ]));
            }
            for(var i = 0, l = this.tables.length; i < l; i++) {
                types.appendChild(util.createElement(doc, 'Override', [
                    ['PartName', "/xl/tables/table" + (i + 1) + ".xml"],
                    ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"]
                ]));
            }
            
            for(var i = 0, l = this.drawings.length; i < l; i++) {
                types.appendChild(util.createElement(doc, 'Override', [
                    ['PartName', '/xl/drawings/drawing' + (i + 1) + '.xml'],
                    ['ContentType', 'application/vnd.openxmlformats-officedocument.drawing+xml']
                ]));
            }
            
            return doc;
        },

        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'workbook');
            var wb = doc.documentElement;
            wb.setAttribute('xmlns:r', util.schemas.relationships);

            var sheets = util.createElement(doc, 'sheets');
            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                var sheet = doc.createElement('sheet');
                sheet.setAttribute('name', this.worksheets[i].name);
                sheet.setAttribute('sheetId', i + 1);
                sheet.setAttribute('r:id', this.relations.getRelationshipId(this.worksheets[i]))
                sheets.appendChild(sheet);
            }
            wb.appendChild(sheets);
            return doc;
        },

        createWorkbookRelationship: function () {
            var doc = util.createXmlDoc(util.schemas.relationshipPackage, 'Relationships');
            var relationships = doc.documentElement;
            relationships.appendChild(util.createElement(doc, 'Relationship', [
                ['Id', 'rId1'],
                ['Type', util.schemas.officeDocument],
                ['Target', 'xl/workbook.xml']
                ]));
            return doc;
        },
        
        _generateCorePaths: function (files) {
            Paths[this.styleSheet.id] = 'styles.xml';
            Paths[this.sharedStrings.id] = 'sharedStrings.xml';
            Paths[this.id] = '/xl/workbook.xml';
            
            for(var i = 0, l = this.tables.length; i < l; i++) {
                files['/xl/tables/table' + (i + 1) + '.xml'] = this.tables[i].toXML();
                Paths[this.tables[i].id] = '/xl/tables/table' + (i + 1) + '.xml';
            }
            
            for(var fileName in this.media) {
                var media = this.media[fileName];
                files['/xl/media/' + fileName] = media.data;
                Paths[fileName] = '/xl/media/' + fileName;
            }
            
            for(var i = 0, l = this.drawings.length; i < l; i++) {
                files['/xl/drawings/drawing' + (i + 1) + '.xml'] = this.drawings[i].toXML();
                Paths[this.drawings[i].id] = '/xl/drawings/drawing' + (i + 1) + '.xml';
                files['/xl/drawings/_rels/drawing' + (i + 1) + '.xml.rels'] = this.drawings[i].relations.toXML();
            }
            
            
        },
        
        _prepareFilesForPackaging: function (files) {
            
            _.extend(files, {
                '/[Content_Types].xml': this.createContentTypes(),
                '/_rels/.rels': this.createWorkbookRelationship(),
                '/xl/styles.xml': this.styleSheet.toXML(),
                '/xl/workbook.xml': this.toXML(),
                '/xl/sharedStrings.xml': this.sharedStrings.toXML(),
                '/xl/_rels/workbook.xml.rels': this.relations.toXML()
            });

            _.each(files, function (value, key) {
				if(key.indexOf('.xml') != -1 || key.indexOf('.rels') != -1) {
					if (value instanceof XMLDOM){
						files[key] = value.toString();
					} else {
						files[key] = value.xml || new XMLSerializer().serializeToString(value);
					}
                    var content = files[key].replace(/xmlns=""/g, '');
                    content = content.replace(/NS[\d]+:/g, '');
                    content = content.replace(/xmlns:NS[\d]+=""/g, '');
                    files[key] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + "\n" + content;
                }
            });
        },
        
        generateFilesAsync: function (options) {
            var requireJsPath = options.requireJsPath;
            var self = this;
            if(!options.requireJsPath) {
                requireJsPath = document.getElementById('requirejs') ? document.getElementById('requirejs').src : '';
            }
            if(!requireJsPath) {
                throw "Please add 'requirejs' to the script that includes requirejs, or specify the path as an argument";
            }
            var files = {},
                doneCount = this.worksheets.length,
                stringsCollectedCount = this.worksheets.length,
                workers = [];
            
            var result = {
                status: "Not Started",
                terminate: function () {
                    for(var i = 0; i < workers.length; i++) {
                        workers[i].terminate();
                    }
                }
            };
            this._generateCorePaths(files);
            
            var done = function () {
                if(--doneCount === 0) {
                    self._prepareFilesForPackaging(files);
                    for(var i = 0; i < workers.length; i++) {
                        workers[i].terminate();
                    }
                    options.success(files);
                }
            };
            var stringsCollected = function () {
                if(--stringsCollectedCount === 0) {
                    for(var i = 0; i < workers.length; i++) {
                        workers[i].postMessage({
                            instruction: 'export',
                            sharedStrings: self.sharedStrings.exportData()
                        });
                    }
                }
            }
            
            
            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                workers.push(
                    this._createWorker(requireJsPath, i, function (worksheetIndex) {
                        return {
                            error: function () {
                                for(var i = 0; i < workers.length; i++) {
                                    workers[i].terminate();
                                }
                                //message, filename, lineno
                                options.error.apply(this, arguments);
                            },
                            stringsCollected: function () {
                                stringsCollected();
                            },
                            finished: function (data) {
                                files['/xl/worksheets/sheet' + (worksheetIndex + 1) + '.xml'] = {xml: data};
                                Paths[self.worksheets[worksheetIndex].id] = 'worksheets/sheet' + (worksheetIndex + 1) + '.xml';
                                files['/xl/worksheets/_rels/sheet' + (worksheetIndex + 1) + '.xml.rels'] = self.worksheets[worksheetIndex].relations.toXML();
                                done();
                            }
                        };
                    }(i))
                );
            }
            
            return result;
        },
                
        _createWorker: function (requireJsPath, worksheetIndex, callbacks) {
            var worker = new Worker(require.toUrl('./WorksheetExportWorker.js'));
            var self = this;
            worker.addEventListener('error', callbacks.error);
            worker.addEventListener('message', function(event, data) {
//                console.log("Called back by the worker!\n", event.data);
                switch(event.data.status) {
                    case "ready":
                        worker.postMessage({
                            instruction: 'start',
                            data: self.worksheets[worksheetIndex].exportData()
                        });
                        break;
                    case "sharedStrings":
                        for(var i = 0; i < event.data.data.length; i++) {
                            self.sharedStrings.addString(event.data.data[i]);
                        }
                        callbacks.stringsCollected();
                        break;
                    case "finished":
                        callbacks.finished(event.data.data);
                        break;
                }
            }, false);
            worker.postMessage({
                instruction: 'setup',
                config: {
                    paths: {
                        underscore: require.toUrl('underscore').slice(0, -3)
                    },
                    shim: {
                        'underscore': {
                            exports: '_'
                        }
                    }
                },
                requireJsPath: requireJsPath
            });
            return worker;
        },
        
        generateFiles: function () {
            var files = {};
            this._generateCorePaths(files);
            
            
            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                files['/xl/worksheets/sheet' + (i + 1) + '.xml'] = this.worksheets[i].toXML();
                Paths[this.worksheets[i].id] = 'worksheets/sheet' + (i + 1) + '.xml';
                files['/xl/worksheets/_rels/sheet' + (i + 1) + '.xml.rels'] = this.worksheets[i].relations.toXML();
            }
            
            this._prepareFilesForPackaging(files);

            return files;
        }
    });
    return Workbook;
});


onmessage = function(event) {
    importScripts(event.data.ziplib);
    
    var zip = new JSZip();
    var files = event.data.files;
    for(var path in files) {
        var content = files[path];
        path = path.substr(1);
        zip.file(path, content, {base64: false});
    };
    postMessage({
        base64: !!event.data.base64
    });
    postMessage({
        status: 'done',
        data: zip.generate({
            base64: !!event.data.base64
        })
    });
};




define("Excel/ZipWorker.js", function(){});

define('buildtools/index',["../Excel/Drawings.js","../Excel/Drawings/AbsoluteAnchor.js","../Excel/Drawings/Chart.js","../Excel/Drawings/Drawing.js","../Excel/Drawings/OneCellAnchor.js","../Excel/Drawings/Picture.js","../Excel/Drawings/TwoCellAnchor.js","../Excel/Paths.js","../Excel/Positioning.js","../Excel/RelationshipManager.js","../Excel/SharedStrings.js","../Excel/StyleSheet.js","../Excel/Table.js","../Excel/Workbook.js","../Excel/Worksheet.js","../Excel/XMLDOM.js","../Excel/ZipWorker.js","../Excel/util.js"], function () {});
    root.ExcelBuilder = require('excel-builder');
})(window);