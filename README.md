excel-builder.js
================

A way to build excel files with javascript

Documentation at http://excelbuilderjs.com/. This includes a 'cookbook' and some 
API documentation. 

Building
--------

Install Grunt:

	npm install -g grunt-cli

Install dependencies:

	npm install

Combine & uglify:

	grunt requirejs

Distributables
---------------
excel-builder.compiled.js -> All files in the EB package + Underscore

excel-builder.dist.js -> All files in the EB package + Underscore, with no need for external AMD provider (Web worker will not function in this build).